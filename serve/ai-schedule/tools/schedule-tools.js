const { DynamicStructuredTool } = require('@langchain/core/tools');
const { z } = require('zod');
const db = require('../../db/index');
const { checkConflict, generateConflictReport } = require('../utils/conflict-checker');
const { findAffectedSchedules, delaySchedules } = require('../utils/vip-priority-handler');
const { needsConflictCheck } = require('../utils/project-type-checker');
const { findAvailableRooms } = require('../utils/resource-allocator');

const queryScheduleTool = new DynamicStructuredTool({
  name: 'query_schedule',
  description: '查询排班情况。根据日期、医生ID查询排班记录。',
  schema: z.object({
    date: z.string().describe('日期，格式：YYYY-MM-DD'),
    doctor_id: z.number().optional().describe('医生ID，可选')
  }),
  func: async ({ date, doctor_id }) => {
    return new Promise((resolve, reject) => {
      let sql = `SELECT 
        s.*,
        u1.username as doctor_name,
        u2.username as nurse_name
        FROM schedule s
        LEFT JOIN user u1 ON s.doctor_id = u1.id
        LEFT JOIN user u2 ON s.nurse_id = u2.id
        WHERE DATE(s.start_time) = ?`;
      const params = [date];

      if (doctor_id) {
        sql += ` AND s.doctor_id = ?`;
        params.push(doctor_id);
      }

      sql += ` ORDER BY s.start_time ASC`;

      db.query(sql, params, (err, results) => {
        if (err) {
          reject(new Error(`查询排班失败: ${err.message}`));
          return;
        }
        
        const formattedResults = (results || []).map(schedule => {
          const formatLocalTime = (dateTime) => {
            if (!dateTime) return null;
            const date = new Date(dateTime);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            // const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
          };
          
          return {
            ...schedule,
            start_time: formatLocalTime(schedule.start_time),
            end_time: formatLocalTime(schedule.end_time)
          };
        });
        
        resolve(JSON.stringify({
          success: true,
          count: formattedResults.length,
          schedules: formattedResults
        }));
      });
    });
  }
});

const checkConflictTool = new DynamicStructuredTool({
  name: 'check_conflict',
  description: '检查排班冲突。检查指定时间段内医生和诊室是否有冲突。',
  schema: z.object({
    project: z.string().describe('项目类型'),
    doctor_id: z.number().describe('医生ID'),
    nurse_id: z.number().optional().describe('护士ID，可选'),
    room: z.string().describe('诊室名称'),
    start_time: z.string().describe('开始时间，格式：YYYY-MM-DD HH:mm:ss'),
    duration: z.number().describe('时长（分钟）'),
    buffer_time: z.number().optional().describe('缓冲时间（分钟），可选'),
    is_vip_priority: z.boolean().optional().describe('是否为VIP优先，可选')
  }),
  func: async ({ project, doctor_id, nurse_id, room, start_time, duration, buffer_time, is_vip_priority }) => {
    return new Promise((resolve, reject) => {
      checkConflict({
        project,
        doctor_id,
        nurse_id,
        room,
        start_time,
        duration,
        buffer_time,
        is_vip_priority: is_vip_priority || false
      }, (err, result) => {
        if (err) {
          reject(new Error(`冲突检测失败: ${err.message}`));
          return;
        }
        const report = generateConflictReport(result);
        resolve(JSON.stringify({
          success: true,
          has_conflict: result.has_conflict,
          conflict_types: result.conflict_types,
          conflict_details: result.conflict_details,
          report: report,
          skip_conflict_check: result.skip_conflict_check
        }));
      });
    });
  }
});

const createScheduleTool = new DynamicStructuredTool({
  name: 'create_schedule',
  description: '创建排班记录。直接使用医生姓名、护士姓名、客户姓名。',
  schema: z.object({
    project: z.string().describe('项目类型'),
    doctor_name: z.string().describe('医生姓名'),
    nurse_name: z.string().optional().describe('护士姓名，可选'),
    customer_name: z.string().describe('客户姓名'),
    room: z.string().optional().describe('诊室名称，可选，默认自动分配'),
    start_time: z.string().describe('开始时间，格式：YYYY-MM-DD HH:mm:ss'),
    duration: z.number().optional().describe('时长（分钟），可选，根据项目类型自动设置'),
    remark: z.string().optional().describe('备注，可选')
  }),
  func: async ({ project, doctor_name, nurse_name, customer_name, room, start_time, duration, remark }) => {
    const findUser = (name, role) => {
      return new Promise((resolve, reject) => {
        db.query('SELECT id, username FROM user WHERE username LIKE ? AND role = ?', 
          [`%${name}%`, role], (err, results) => {
            if (err) return reject(err);
            resolve(results.length > 0 ? results[0] : null);
          });
      });
    };

    try {
      const doctor = await findUser(doctor_name, '医生椅旁技师');
      if (!doctor) {
        return JSON.stringify({ success: false, message: `未找到医生：${doctor_name}` });
      }

      let nurse = null;
      if (nurse_name) {
        nurse = await findUser(nurse_name, '护士');
      }

      const projectDurations = {
        '面诊': 30, '雕蜡': 60, '椅旁': 90,
        '备牙': 120, '戴牙': 60, '复诊': 30, '蜡形试戴': 45
      };
      const finalDuration = duration || projectDurations[project] || 60;

      const startTime = new Date(start_time);
      const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000);

      const findAvailableRoom = () => {
        return new Promise((resolve, reject) => {
          findAvailableRooms(start_time, { start_time: startTime, end_time: endTime }, (err, availableRooms) => {
            if (err) return reject(err);
            resolve(availableRooms && availableRooms.length > 0 ? availableRooms[0].room : null);
          });
        });
      };

      let finalRoom = room;
      if (!finalRoom) {
        finalRoom = await findAvailableRoom();
        if (!finalRoom) {
          return JSON.stringify({ 
            success: false, 
            message: `该时间段所有诊室都已被占用，请选择其他时间` 
          });
        }
      }

      if (needsConflictCheck(project)) {
        return new Promise((resolve, reject) => {
          checkConflict({
            project,
            doctor_id: doctor.id,
            nurse_id: nurse?.id,
            room: finalRoom,
            start_time: start_time,
            duration: finalDuration,
            buffer_time: 0,
            is_vip_priority: false
          }, (err, conflictResult) => {
            if (err) {
              return reject(new Error(`冲突检测失败: ${err.message}`));
            }

            if (conflictResult.has_conflict) {
              const report = generateConflictReport(conflictResult);
              return resolve(JSON.stringify({
                success: false,
                message: `排班创建失败：检测到冲突`,
                conflict_details: conflictResult.conflict_details,
                report: report
              }));
            }

            db.query(`INSERT INTO schedule 
              (project, doctor_id, nurse_id, customer_name, room, start_time, end_time, duration, remark)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [project, doctor.id, nurse?.id || null, customer_name, finalRoom, startTime, endTime, finalDuration, remark || null],
              (err, results) => {
                if (err) return reject(new Error(`创建排班失败: ${err.message}`));
                resolve(JSON.stringify({
                  success: true,
                  schedule_id: results.insertId,
                  message: '排班创建成功',
                  details: {
                    doctor: doctor.username,
                    nurse: nurse?.username || '未指定',
                    customer: customer_name,
                    room: finalRoom,
                    duration: finalDuration
                  }
                }));
              });
          });
        });
      } else {
        return new Promise((resolve, reject) => {
          db.query(`INSERT INTO schedule 
            (project, doctor_id, nurse_id, customer_name, room, start_time, end_time, duration, remark)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [project, doctor.id, nurse?.id || null, customer_name, finalRoom, startTime, endTime, finalDuration, remark || null],
            (err, results) => {
              if (err) return reject(new Error(`创建排班失败: ${err.message}`));
              resolve(JSON.stringify({
                success: true,
                schedule_id: results.insertId,
                message: '排班创建成功',
                details: {
                  doctor: doctor.username,
                  nurse: nurse?.username || '未指定',
                  customer: customer_name,
                  room: finalRoom,
                  duration: finalDuration
                }
              }));
            });
        });
      }
    } catch (error) {
      return JSON.stringify({ success: false, message: `创建排班失败: ${error.message}` });
    }
  }
});


const vipPriorityInsertTool = new DynamicStructuredTool({
  name: 'vip_priority_insert',
  description: 'VIP优先插入排班。允许插入到冲突时间段，并自动顺延受影响排班。',
  schema: z.object({
    project: z.string().describe('项目类型'),
    doctor_name: z.string().describe('医生姓名'),
    nurse_name: z.string().optional().describe('护士姓名，可选'),
    customer_name: z.string().describe('客户姓名'),
    room: z.string().optional().describe('诊室名称，可选'),
    start_time: z.string().describe('开始时间，格式：YYYY-MM-DD HH:mm:ss'),
    duration: z.number().optional().describe('时长（分钟），可选'),
    remark: z.string().optional().describe('备注，可选')
  }),
  func: async ({ project, doctor_name, nurse_name, customer_name, room, start_time, duration, remark }) => {
    const findUser = (name, role) => {
      return new Promise((resolve, reject) => {
        db.query('SELECT id, username FROM user WHERE username LIKE ? AND role = ?', 
          [`%${name}%`, role], (err, results) => {
            if (err) return reject(err);
            resolve(results.length > 0 ? results[0] : null);
          });
      });
    };

    try {
      const doctor = await findUser(doctor_name, '医生椅旁技师');
      if (!doctor) {
        return JSON.stringify({ success: false, message: `未找到医生：${doctor_name}` });
      }

      let nurse = null;
      if (nurse_name) {
        nurse = await findUser(nurse_name, '护士');
      }

      const projectDurations = {
        '面诊': 30, '雕蜡': 60, '椅旁': 90,
        '备牙': 120, '戴牙': 60, '复诊': 30, '蜡形试戴': 45
      };
      const finalDuration = duration || projectDurations[project] || 60;

      const startTime = new Date(start_time);
      const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000);

      const findAvailableRoom = () => {
        return new Promise((resolve, reject) => {
          findAvailableRooms(start_time, { start_time: startTime, end_time: endTime }, (err, availableRooms) => {
            if (err) return reject(err);
            resolve(availableRooms && availableRooms.length > 0 ? availableRooms[0].room : null);
          });
        });
      };

      let finalRoom = room;
      if (!finalRoom) {
        finalRoom = await findAvailableRoom();
        if (!finalRoom) {
          finalRoom = '诊室1';
        }
      }

      return new Promise((resolve, reject) => {
        db.beginTransaction((err) => {
          if (err) return reject(new Error(`开始事务失败: ${err.message}`));

          db.query(`INSERT INTO schedule 
            (project, doctor_id, nurse_id, customer_name, room, start_time, end_time, duration, remark)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [project, doctor.id, nurse?.id || null, customer_name, finalRoom, startTime, endTime, finalDuration, remark || null],
            (err, insertResult) => {
              if (err) return db.rollback(() => reject(new Error(`插入排班失败: ${err.message}`)));

              const scheduleId = insertResult.insertId;

              findAffectedSchedules(doctor.id, finalRoom, startTime, (err, affectedSchedules) => {
                if (err) return db.rollback(() => reject(new Error(`查询受影响排班失败: ${err.message}`)));

                if (!affectedSchedules || affectedSchedules.length === 0) {
                  return db.commit((err) => {
                    if (err) return db.rollback(() => reject(new Error(`提交事务失败: ${err.message}`)));
                    resolve(JSON.stringify({
                      success: true,
                      schedule_id: scheduleId,
                      affected_count: 0,
                      message: 'VIP排班创建成功',
                      details: { room: finalRoom }
                    }));
                  });
                }

                const affectedIds = affectedSchedules.map(s => s.id);
                delaySchedules(affectedIds, finalDuration, (err, delayResult) => {
                  if (err) return db.rollback(() => reject(new Error(`顺延排班失败: ${err.message}`)));

                  db.commit((err) => {
                    if (err) return db.rollback(() => reject(new Error(`提交事务失败: ${err.message}`)));
                    resolve(JSON.stringify({
                      success: true,
                      schedule_id: scheduleId,
                      affected_count: delayResult.affected_count,
                      message: 'VIP排班创建成功，已顺延受影响排班',
                      details: { room: finalRoom }
                    }));
                  });
                });
              });
            });
        });
      });
    } catch (error) {
      return JSON.stringify({ success: false, message: `VIP排班创建失败: ${error.message}` });
    }
  }
});

const delaySchedulesTool = new DynamicStructuredTool({
  name: 'delay_schedules',
  description: '批量顺延排班时间。用于VIP优先插入后调整受影响排班。',
  schema: z.object({
    schedule_ids: z.array(z.number()).describe('需要顺延的排班ID列表'),
    delay_duration: z.number().describe('顺延时长（分钟）')
  }),
  func: async ({ schedule_ids, delay_duration }) => {
    return new Promise((resolve, reject) => {
      delaySchedules(schedule_ids, delay_duration, (err, result) => {
        if (err) {
          reject(new Error(`顺延排班失败: ${err.message}`));
          return;
        }
        resolve(JSON.stringify({
          success: true,
          affected_count: result.affected_count,
          message: `成功顺延${result.affected_count}个排班`
        }));
      });
    });
  }
});

const updateScheduleTool = new DynamicStructuredTool({
  name: 'update_schedule',
  description: '修改已存在的排班记录。可以修改客户、护士、备注等非冲突字段直接更新；修改医生、时间、诊室等冲突字段需要先检测冲突。',
  schema: z.object({
    schedule_id: z.number().describe('要修改的排班ID'),
    doctor_name: z.string().optional().describe('新的医生姓名，可选'),
    nurse_name: z.string().optional().describe('新的护士姓名，可选，传空字符串表示清除护士'),
    customer_name: z.string().optional().describe('新的客户姓名，可选'),
    room: z.string().optional().describe('新的诊室名称，可选'),
    start_time: z.string().optional().describe('新的开始时间，格式：YYYY-MM-DD HH:mm:ss，可选'),
    duration: z.number().optional().describe('新的时长（分钟），可选'),
    project: z.string().optional().describe('新的项目类型，可选'),
    remark: z.string().optional().describe('新的备注，可选'),
    skip_conflict_check: z.boolean().optional().describe('是否跳过冲突检测，默认false')
  }),
  func: async ({ schedule_id, doctor_name, nurse_name, customer_name, room, start_time, duration, project, remark, skip_conflict_check }) => {
    const findUser = (name, role) => {
      return new Promise((resolve, reject) => {
        db.query('SELECT id, username FROM user WHERE username LIKE ? AND role = ?', 
          [`%${name}%`, role], (err, results) => {
            if (err) return reject(err);
            resolve(results.length > 0 ? results[0] : null);
          });
      });
    };

    const getScheduleById = (id) => {
      return new Promise((resolve, reject) => {
        db.query('SELECT * FROM schedule WHERE id = ?', [id], (err, results) => {
          if (err) return reject(err);
          resolve(results.length > 0 ? results[0] : null);
        });
      });
    };

    try {
      const existingSchedule = await getScheduleById(schedule_id);
      if (!existingSchedule) {
        return JSON.stringify({ success: false, message: `未找到ID为${schedule_id}的排班记录` });
      }

      const updates = {};
      const conflictFields = [];

      if (doctor_name !== undefined) {
        const doctor = await findUser(doctor_name, '医生椅旁技师');
        if (!doctor) {
          return JSON.stringify({ success: false, message: `未找到医生：${doctor_name}` });
        }
        if (doctor.id !== existingSchedule.doctor_id) {
          updates.doctor_id = doctor.id;
          conflictFields.push('doctor');
        }
      }

      if (nurse_name !== undefined) {
        if (nurse_name === '' || nurse_name === null) {
          updates.nurse_id = null;
        } else {
          const nurse = await findUser(nurse_name, '护士');
          if (nurse) {
            updates.nurse_id = nurse.id;
          }
        }
      }

      if (customer_name !== undefined) {
        updates.customer_name = customer_name;
      }

      if (room !== undefined && room !== existingSchedule.room) {
        updates.room = room;
        conflictFields.push('room');
      }

      if (start_time !== undefined) {
        const newStartTime = new Date(start_time);
        const oldStartTime = new Date(existingSchedule.start_time);
        if (newStartTime.getTime() !== oldStartTime.getTime()) {
          updates.start_time = newStartTime;
          conflictFields.push('time');
        }
      }

      if (duration !== undefined && duration !== existingSchedule.duration) {
        updates.duration = duration;
        conflictFields.push('duration');
      }

      if (project !== undefined && project !== existingSchedule.project) {
        updates.project = project;
        if (needsConflictCheck(project)) {
          conflictFields.push('project');
        }
      }

      if (remark !== undefined) {
        updates.remark = remark;
      }

      if (Object.keys(updates).length === 0) {
        return JSON.stringify({ success: true, message: '没有需要更新的字段' });
      }

      const finalStartTime = updates.start_time || existingSchedule.start_time;
      const finalDuration = updates.duration || existingSchedule.duration;
      const finalDoctorId = updates.doctor_id || existingSchedule.doctor_id;
      const finalRoom = updates.room || existingSchedule.room;
      const finalProject = updates.project || existingSchedule.project;

      if (updates.start_time || updates.duration) {
        const startTime = new Date(finalStartTime);
        const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000);
        updates.end_time = endTime;
        updates.start_time = startTime;
      }

      const needsCheck = conflictFields.length > 0 && !skip_conflict_check && needsConflictCheck(finalProject);

      if (needsCheck) {
        return new Promise((resolve, reject) => {
          const startTimeForCheck = new Date(finalStartTime);
          const endTimeForCheck = new Date(startTimeForCheck.getTime() + finalDuration * 60 * 1000);

          checkConflict({
            project: finalProject,
            doctor_id: finalDoctorId,
            nurse_id: updates.nurse_id !== undefined ? updates.nurse_id : existingSchedule.nurse_id,
            room: finalRoom,
            start_time: startTimeForCheck.toISOString().replace('T', ' ').slice(0, 19),
            duration: finalDuration,
            buffer_time: 0,
            is_vip_priority: false,
            exclude_schedule_id: schedule_id
          }, (err, conflictResult) => {
            if (err) {
              return reject(new Error(`冲突检测失败: ${err.message}`));
            }

            if (conflictResult.has_conflict) {
              const report = generateConflictReport(conflictResult);
              return resolve(JSON.stringify({
                success: false,
                message: `排班修改失败：检测到冲突`,
                conflict_details: conflictResult.conflict_details,
                conflict_fields: conflictFields,
                report: report,
                suggestion: '请询问用户如何处理冲突：1. 选择其他时间/医生/诊室 2. 强制修改（覆盖冲突）'
              }));
            }

            executeUpdate();
          });

          function executeUpdate() {
            const setClauses = [];
            const params = [];

            for (const [key, value] of Object.entries(updates)) {
              setClauses.push(`${key} = ?`);
              params.push(value);
            }

            params.push(schedule_id);

            db.query(`UPDATE schedule SET ${setClauses.join(', ')} WHERE id = ?`, params, (err, result) => {
              if (err) {
                return reject(new Error(`更新排班失败: ${err.message}`));
              }
              resolve(JSON.stringify({
                success: true,
                message: '排班修改成功',
                updated_fields: Object.keys(updates),
                schedule_id: schedule_id
              }));
            });
          }
        });
      } else {
        return new Promise((resolve, reject) => {
          const setClauses = [];
          const params = [];

          for (const [key, value] of Object.entries(updates)) {
            setClauses.push(`${key} = ?`);
            params.push(value);
          }

          params.push(schedule_id);

          db.query(`UPDATE schedule SET ${setClauses.join(', ')} WHERE id = ?`, params, (err, result) => {
            if (err) {
              return reject(new Error(`更新排班失败: ${err.message}`));
            }
            resolve(JSON.stringify({
              success: true,
              message: '排班修改成功',
              updated_fields: Object.keys(updates),
              schedule_id: schedule_id
            }));
          });
        });
      }
    } catch (error) {
      return JSON.stringify({ success: false, message: `修改排班失败: ${error.message}` });
    }
  }
});

module.exports = {
  queryScheduleTool,
  checkConflictTool,
  createScheduleTool,
  vipPriorityInsertTool,
  delaySchedulesTool,
  updateScheduleTool
};
