const { DynamicStructuredTool } = require('@langchain/core/tools');
const { z } = require('zod');
const db = require('../../db/index');
const { checkConflict, generateConflictReport } = require('../utils/conflict-checker');
const { findAffectedSchedules, delaySchedules } = require('../utils/vip-priority-handler');
const { needsConflictCheck } = require('../utils/project-type-checker');

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
        u2.username as nurse_name,
        c.customer_name
        FROM schedule s
        LEFT JOIN user u1 ON s.doctor_id = u1.id
        LEFT JOIN user u2 ON s.nurse_id = u2.id
        LEFT JOIN customer c ON s.customer_id = c.id
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
        resolve(JSON.stringify({
          success: true,
          count: results.length,
          schedules: results
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
  description: '创建排班记录。需要提供完整的排班信息。',
  schema: z.object({
    project: z.string().describe('项目类型'),
    doctor_id: z.number().describe('医生ID'),
    nurse_id: z.number().optional().describe('护士ID，可选'),
    customer_id: z.number().describe('客户ID'),
    room: z.string().describe('诊室名称'),
    start_time: z.string().describe('开始时间，格式：YYYY-MM-DD HH:mm:ss'),
    duration: z.number().describe('时长（分钟）'),
    remark: z.string().optional().describe('备注，可选')
  }),
  func: async ({ project, doctor_id, nurse_id, customer_id, room, start_time, duration, remark }) => {
    return new Promise((resolve, reject) => {
      const startTime = new Date(start_time);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      const sql = `INSERT INTO schedule 
        (project, doctor_id, nurse_id, customer_id, room, start_time, end_time, duration, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(sql, [
        project,
        doctor_id,
        nurse_id || null,
        customer_id,
        room,
        startTime,
        endTime,
        duration,
        remark || null
      ], (err, results) => {
        if (err) {
          reject(new Error(`创建排班失败: ${err.message}`));
          return;
        }
        resolve(JSON.stringify({
          success: true,
          schedule_id: results.insertId,
          message: '排班创建成功'
        }));
      });
    });
  }
});


const vipPriorityInsertTool = new DynamicStructuredTool({
  name: 'vip_priority_insert',
  description: 'VIP优先插入排班。允许插入到冲突时间段，并自动顺延受影响排班。',
  schema: z.object({
    project: z.string().describe('项目类型'),
    doctor_id: z.number().describe('医生ID'),
    nurse_id: z.number().optional().describe('护士ID，可选'),
    customer_id: z.number().describe('客户ID'),
    room: z.string().describe('诊室名称'),
    start_time: z.string().describe('开始时间，格式：YYYY-MM-DD HH:mm:ss'),
    duration: z.number().describe('时长（分钟）'),
    remark: z.string().optional().describe('备注，可选')
  }),
  func: async ({ project, doctor_id, nurse_id, customer_id, room, start_time, duration, remark }) => {
    return new Promise((resolve, reject) => {
      const startTime = new Date(start_time);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      db.beginTransaction((err) => {
        if (err) {
          return reject(new Error(`开始事务失败: ${err.message}`));
        }

        db.query(`INSERT INTO schedule 
          (project, doctor_id, nurse_id, customer_id, room, start_time, end_time, duration, remark)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [project, doctor_id, nurse_id || null, customer_id, room, startTime, endTime, duration, remark || null],
          (err, insertResult) => {
            if (err) {
              return db.rollback(() => reject(new Error(`插入排班失败: ${err.message}`)));
            }

            const scheduleId = insertResult.insertId;

            findAffectedSchedules(doctor_id, room, startTime, (err, affectedSchedules) => {
              if (err) {
                return db.rollback(() => reject(new Error(`查询受影响排班失败: ${err.message}`)));
              }

              if (!affectedSchedules || affectedSchedules.length === 0) {
                return db.commit((err) => {
                  if (err) {
                    return db.rollback(() => reject(new Error(`提交事务失败: ${err.message}`)));
                  }
                  resolve(JSON.stringify({
                    success: true,
                    schedule_id: scheduleId,
                    affected_count: 0,
                    message: 'VIP排班创建成功'
                  }));
                });
              }

              const affectedIds = affectedSchedules.map(s => s.id);
              delaySchedules(affectedIds, duration, (err, delayResult) => {
                if (err) {
                  return db.rollback(() => reject(new Error(`顺延排班失败: ${err.message}`)));
                }

                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => reject(new Error(`提交事务失败: ${err.message}`)));
                  }
                  resolve(JSON.stringify({
                    success: true,
                    schedule_id: scheduleId,
                    affected_count: delayResult.affected_count,
                    message: 'VIP排班创建成功，已顺延受影响排班'
                  }));
                });
              });
            });
          });
      });
    });
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

module.exports = {
  queryScheduleTool,
  checkConflictTool,
  createScheduleTool,
  vipPriorityInsertTool,
  delaySchedulesTool
};
