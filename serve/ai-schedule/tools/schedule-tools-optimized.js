const { DynamicStructuredTool } = require('@langchain/core/tools');
const { z } = require('zod');
const db = require('../../db/index');
const { checkConflict, generateConflictReport } = require('../utils/conflict-checker');
const { findAffectedSchedules, delaySchedules, delaySchedulesInTransaction } = require('../utils/vip-priority-handler');
const { needsConflictCheck } = require('../utils/project-type-checker');
const { findAvailableRooms } = require('../utils/resource-allocator');

const manageScheduleTool = new DynamicStructuredTool({
  name: 'manage_schedule',
  description: '统一的排班管理工具。支持查询、创建、修改、强制插入/更新排班。',
  schema: z.object({
    action: z.enum(['query', 'create', 'update', 'force_insert', 'force_update']).describe('操作类型'),
    date: z.string().optional().describe('日期YYYY-MM-DD，查询时必填'),
    doctor_id: z.number().optional().describe('医生ID，查询时可选'),
    schedule_id: z.number().optional().describe('排班ID，修改时必填'),
    project: z.string().optional().describe('项目类型'),
    doctor_name: z.string().optional().describe('医生姓名'),
    nurse_name: z.string().optional().describe('护士姓名'),
    customer_name: z.string().optional().describe('客户姓名'),
    room: z.string().optional().describe('诊室'),
    start_time: z.string().optional().describe('开始时间YYYY-MM-DD HH:mm:ss'),
    duration: z.number().optional().describe('时长(分钟)'),
    buffer_time: z.number().optional().describe('缓冲时间(分钟)'),
    remark: z.string().optional().describe('备注'),
    is_vip_priority: z.boolean().optional().describe('是否VIP优先')
  }),
  func: async (params) => {
    const { action } = params;
    const toolStart = Date.now();
    console.log(`[TOOL] manage_schedule called, action: ${action}`);
    
    try {
      let result;
      switch (action) {
        case 'query':
          result = await querySchedule(params);
          break;
        case 'create':
          result = await createSchedule(params);
          break;
        case 'update':
          result = await updateSchedule(params);
          break;
        case 'force_insert':
          result = await forceInsertSchedule(params);
          break;
        case 'force_update':
          result = await forceUpdateSchedule(params);
          break;
        default:
          result = JSON.stringify({ success: false, message: '未知操作类型' });
      }
      console.log(`[TOOL] manage_schedule completed in ${Date.now() - toolStart}ms`);
      return result;
    } catch (error) {
      console.error(`[TOOL] manage_schedule error in ${Date.now() - toolStart}ms:`, error.message);
      return JSON.stringify({ success: false, message: error.message });
    }
  }
});

async function querySchedule({ date, doctor_id }) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT s.*, u1.username as doctor_name, u2.username as nurse_name
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
      if (err) return reject(new Error(`查询失败: ${err.message}`));
      
      const formatted = (results || []).map(s => ({
        ...s,
        start_time: formatTime(s.start_time),
        end_time: formatTime(s.end_time)
      }));
      
      resolve(JSON.stringify({ success: true, count: formatted.length, schedules: formatted }));
    });
  });
}

async function createSchedule(params) {
  const { project, doctor_name, nurse_name, customer_name, room, start_time, duration, buffer_time, remark, is_vip_priority } = params;
  
  if (!project || !doctor_name || !customer_name || !start_time) {
    return JSON.stringify({ success: false, message: '缺少必填字段' });
  }

  return new Promise((resolve, reject) => {
    db.query('SELECT id FROM user WHERE username LIKE ? AND role = ?', 
      [`%${doctor_name}%`, '医生椅旁技师'], async (err, doctors) => {
        if (err) return reject(new Error(`查询医生失败: ${err.message}`));
        if (!doctors || doctors.length === 0) {
          return resolve(JSON.stringify({ success: false, message: `未找到医生: ${doctor_name}` }));
        }

        const doctorId = doctors[0].id;
        let nurseId = null;

        if (nurse_name) {
          const nurses = await new Promise((res, rej) => {
            db.query('SELECT id FROM user WHERE username LIKE ? AND role = ?',
              [`%${nurse_name}%`, '护士'], (e, r) => e ? rej(e) : res(r));
          });
          nurseId = nurses && nurses.length > 0 ? nurses[0].id : null;
        }

        const projectDurations = { '面诊': 40, '备牙': 70, '戴牙': 90, '复诊': 30, '雕蜡': 60, '蜡形试戴': 45, '椅旁': 60, '休息': 30 };
        const finalDuration = duration || projectDurations[project] || 60;
        const startTime = new Date(start_time);
        const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000);

        if (needsConflictCheck(project) && !['何锐', '孙韩宇'].some(n => doctor_name.includes(n))) {
          checkConflict({ project, doctor_id: doctorId, nurse_id: nurseId, start_time, duration: finalDuration, buffer_time, is_vip_priority }, 
            async (err, conflictResult) => {
              if (err) return reject(new Error(`冲突检测失败: ${err.message}`));
              
              if (conflictResult.has_conflict) {
                return resolve(JSON.stringify({
                  success: false,
                  has_conflict: true,
                  conflict_details: conflictResult,
                  message: generateConflictReport(conflictResult)
                }));
              }

              await insertSchedule(doctorId, nurseId, customer_name, room, startTime, endTime, finalDuration, project, remark, resolve, reject);
            });
        } else {
          await insertSchedule(doctorId, nurseId, customer_name, room, startTime, endTime, finalDuration, project, remark, resolve, reject);
        }
      });
  });
}

async function insertSchedule(doctorId, nurseId, customer_name, room, startTime, endTime, duration, project, remark, resolve, reject) {
  const finalRoom = room || await getAllocatedRoom(startTime, endTime);
  
  db.query(`INSERT INTO schedule (project, doctor_id, nurse_id, customer_name, room, start_time, end_time, duration, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [project, doctorId, nurseId, customer_name, finalRoom, startTime, endTime, duration, remark],
    (err, results) => {
      if (err) return reject(new Error(`创建失败: ${err.message}`));
      resolve(JSON.stringify({ success: true, schedule_id: results.insertId, message: '排班创建成功' }));
    });
}

async function updateSchedule(params) {
  const { schedule_id, project, doctor_name, nurse_name, customer_name, room, start_time, duration, remark } = params;
  
  if (!schedule_id) {
    return JSON.stringify({ success: false, message: '缺少排班ID' });
  }

  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM schedule WHERE id = ?', [schedule_id], async (err, schedules) => {
      if (err) return reject(new Error(`查询排班失败: ${err.message}`));
      if (!schedules || schedules.length === 0) {
        return resolve(JSON.stringify({ success: false, message: '排班不存在' }));
      }

      const existing = schedules[0];
      const updates = {};
      
      if (project !== undefined) updates.project = project;
      if (customer_name !== undefined) updates.customer_name = customer_name;
      if (remark !== undefined) updates.remark = remark;
      if (room !== undefined) updates.room = room;
      
      if (doctor_name) {
        const doctors = await new Promise((res, rej) => {
          db.query('SELECT id FROM user WHERE username LIKE ? AND role = ?',
            [`%${doctor_name}%`, '医生椅旁技师'], (e, r) => e ? rej(e) : res(r));
        });
        if (doctors && doctors.length > 0) updates.doctor_id = doctors[0].id;
      }
      
      if (nurse_name) {
        const nurses = await new Promise((res, rej) => {
          db.query('SELECT id FROM user WHERE username LIKE ? AND role = ?',
            [`%${nurse_name}%`, '护士'], (e, r) => e ? rej(e) : res(r));
        });
        if (nurses && nurses.length > 0) updates.nurse_id = nurses[0].id;
      }
      
      if (start_time) {
        updates.start_time = new Date(start_time);
        const dur = duration || existing.duration;
        updates.end_time = new Date(updates.start_time.getTime() + dur * 60 * 1000);
        if (duration) updates.duration = duration;
      } else if (duration) {
        updates.duration = duration;
        updates.end_time = new Date(new Date(existing.start_time).getTime() + duration * 60 * 1000);
      }

      const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), schedule_id];
      
      db.query(`UPDATE schedule SET ${setClauses} WHERE id = ?`, values, (err) => {
        if (err) return reject(new Error(`更新失败: ${err.message}`));
        resolve(JSON.stringify({ success: true, schedule_id, message: '排班更新成功' }));
      });
    });
  });
}

async function forceInsertSchedule(params) {
  const { project, doctor_name, customer_name, start_time, duration, room, remark } = params;
  
  return new Promise((resolve, reject) => {
    db.query('SELECT id FROM user WHERE username LIKE ? AND role = ?',
      [`%${doctor_name}%`, '医生椅旁技师'], async (err, doctors) => {
        if (err || !doctors || doctors.length === 0) {
          return resolve(JSON.stringify({ success: false, message: '未找到医生' }));
        }

        const doctorId = doctors[0].id;
        const projectDurations = { '面诊': 40, '备牙': 70, '戴牙': 90, '复诊': 30, '雕蜡': 60, '蜡形试戴': 45, '椅旁': 60, '休息': 30 };
        const finalDuration = duration || projectDurations[project] || 60;
        const startTime = new Date(start_time);
        const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000);
        const finalRoom = room || await getAllocatedRoom(startTime, endTime);

        db.getConnection((err, connection) => {
          if (err) return reject(new Error(`获取连接失败: ${err.message}`));
          
          connection.beginTransaction((err) => {
            if (err) {
              connection.release();
              return reject(new Error(`事务失败: ${err.message}`));
            }

            connection.query(`INSERT INTO schedule (project, doctor_id, customer_name, room, start_time, end_time, duration, remark)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [project, doctorId, customer_name, finalRoom, startTime, endTime, finalDuration, remark],
              (err, results) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    reject(new Error(`插入失败: ${err.message}`));
                  });
                }

                findAffectedSchedules(doctorId, finalRoom, startTime, endTime, (err, affected) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      reject(new Error(`查询受影响排班失败: ${err.message}`));
                    });
                  }

                  if (!affected || affected.length === 0) {
                    return connection.commit((err) => {
                      connection.release();
                      if (err) return reject(new Error(`提交失败: ${err.message}`));
                      resolve(JSON.stringify({ success: true, schedule_id: results.insertId, message: '强制插入成功' }));
                    });
                  }

                  delaySchedulesInTransaction(connection, affected.map(s => s.id), endTime, (err, delayResult) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        reject(new Error(`顺延失败: ${err.message}`));
                      });
                    }

                    connection.commit((err) => {
                      connection.release();
                      if (err) return reject(new Error(`提交失败: ${err.message}`));
                      resolve(JSON.stringify({ 
                        success: true, 
                        schedule_id: results.insertId, 
                        affected_count: delayResult?.affected_count || affected.length,
                        message: '强制插入成功，已顺延受影响排班' 
                      }));
                    });
                  });
                });
              });
          });
        });
      });
  });
}

async function forceUpdateSchedule(params) {
  const { schedule_id, start_time, duration } = params;
  
  if (!schedule_id || !start_time) {
    return JSON.stringify({ success: false, message: '缺少必填参数' });
  }

  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM schedule WHERE id = ?', [schedule_id], (err, schedules) => {
      if (err || !schedules || schedules.length === 0) {
        return resolve(JSON.stringify({ success: false, message: '排班不存在' }));
      }

      const existing = schedules[0];
      const finalDuration = duration || existing.duration;
      const startTime = new Date(start_time);
      const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000);

      db.getConnection((err, connection) => {
        if (err) return reject(new Error(`获取连接失败: ${err.message}`));

        connection.beginTransaction((err) => {
          if (err) {
            connection.release();
            return reject(new Error(`事务失败: ${err.message}`));
          }

          connection.query('UPDATE schedule SET start_time = ?, end_time = ?, duration = ? WHERE id = ?',
            [startTime, endTime, finalDuration, schedule_id], (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  reject(new Error(`更新失败: ${err.message}`));
                });
              }

              findAffectedSchedules(existing.doctor_id, existing.room, startTime, endTime, (err, affected) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    reject(new Error(`查询受影响排班失败: ${err.message}`));
                  });
                }

                const filtered = (affected || []).filter(s => s.id !== schedule_id);
                if (filtered.length === 0) {
                  return connection.commit((err) => {
                    connection.release();
                    if (err) return reject(new Error(`提交失败: ${err.message}`));
                    resolve(JSON.stringify({ success: true, message: '强制更新成功' }));
                  });
                }

                delaySchedulesInTransaction(connection, filtered.map(s => s.id), endTime, (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      reject(new Error(`顺延失败: ${err.message}`));
                    });
                  }

                  connection.commit((err) => {
                    connection.release();
                    if (err) return reject(new Error(`提交失败: ${err.message}`));
                    resolve(JSON.stringify({ 
                      success: true, 
                      affected_count: filtered.length,
                      message: '强制更新成功，已顺延受影响排班' 
                    }));
                  });
                });
              });
            });
        });
      });
    });
  });
}

function formatTime(dateTime) {
  if (!dateTime) return null;
  const date = new Date(dateTime);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

async function getAllocatedRoom(startTime, endTime) {
  return new Promise((resolve) => {
    findAvailableRooms(formatTime(startTime).split(' ')[0], { start_time: startTime, end_time: endTime }, 
      (err, rooms) => {
        resolve(rooms && rooms.length > 0 ? rooms[0].room : '诊室1');
      });
  });
}

const queryUserTool = new DynamicStructuredTool({
  name: 'query_user',
  description: '查询医生或护士信息',
  schema: z.object({
    name: z.string().describe('姓名'),
    role: z.string().optional().describe('角色：医生椅旁技师 或 护士')
  }),
  func: async ({ name, role }) => {
    return new Promise((resolve, reject) => {
      let sql = `SELECT id, username, role FROM user WHERE username LIKE ?`;
      const params = [`%${name}%`];
      if (role) {
        sql += ` AND role = ?`;
        params.push(role);
      }
      db.query(sql, params, (err, results) => {
        if (err) return reject(new Error(`查询失败: ${err.message}`));
        resolve(JSON.stringify({ success: true, count: results.length, users: results }));
      });
    });
  }
});

module.exports = {
  manageScheduleTool,
  queryUserTool
};
