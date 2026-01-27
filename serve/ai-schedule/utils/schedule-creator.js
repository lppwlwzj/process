const db = require('../../db/index');

function validateScheduleInfo(scheduleInfo) {
  const { project, doctor_id, customer_id, start_time, duration } = scheduleInfo;
  
  const errors = [];
  
  if (!project) {
    errors.push('项目类型不能为空');
  }
  
  if (!doctor_id) {
    errors.push('医生ID不能为空');
  }
  
  if (!customer_id) {
    errors.push('客户ID不能为空');
  }
  
  if (!start_time) {
    errors.push('开始时间不能为空');
  }
  
  if (!duration || duration <= 0) {
    errors.push('时长必须大于0');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function createSchedule(scheduleInfo, callback) {
  const validation = validateScheduleInfo(scheduleInfo);
  
  if (!validation.valid) {
    return callback(new Error(validation.errors.join('; ')));
  }
  
  const { project, doctor_id, nurse_id, customer_id, room, start_time, duration, remark } = scheduleInfo;
  
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
      return callback(err);
    }
    callback(null, {
      schedule_id: results.insertId,
      message: '排班创建成功'
    });
  });
}

module.exports = {
  validateScheduleInfo,
  createSchedule
};
