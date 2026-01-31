const db = require('../../db/index');
const { needsConflictCheck } = require('./project-type-checker');

function formatLocalTime(dateTime) {
  if (!dateTime) return null;
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  // const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function checkConflict(scheduleInfo, callback) {
  const { project, doctor_id, nurse_id, room, start_time, duration, buffer_time, is_vip_priority, exclude_schedule_id } = scheduleInfo;

  if (!needsConflictCheck(project) && !is_vip_priority) {
    return callback(null, {
      has_conflict: false,
      conflict_types: [],
      conflict_details: [],
      skip_conflict_check: true
    });
  }

  if (!start_time || !duration) {
    return callback(new Error('缺少开始时间或时长'));
  }

  const startTime = new Date(start_time);
  const totalDuration = duration + (buffer_time || 0);
  const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000);

  const conflicts = [];
  const conflictTypes = [];

  let checkDoctorSql = `SELECT s.id, s.start_time, s.end_time, s.project, s.customer_name
    FROM schedule s
    WHERE s.doctor_id = ?
    AND s.start_time < ? AND s.end_time > ?`;
  const doctorParams = [doctor_id, endTime, startTime];

  if (exclude_schedule_id) {
    checkDoctorSql += ` AND s.id != ?`;
    doctorParams.push(exclude_schedule_id);
  }

  db.query(checkDoctorSql, doctorParams, (err, doctorResults) => {
    if (err) return callback(err);

    if (doctorResults && doctorResults.length > 0) {
      conflictTypes.push('doctor');
      conflicts.push({
        type: 'doctor',
        message: '该医生在此时间段已有排班',
        conflicting_schedules: doctorResults.map(r => ({
          id: r.id,
          customer_name: r.customer_name,
          project: r.project,
          start_time: formatLocalTime(r.start_time),
          end_time: formatLocalTime(r.end_time)
        }))
      });
    }

    let checkRoomSql = `SELECT s.id, s.start_time, s.end_time, s.project, s.customer_name
      FROM schedule s
      WHERE s.room = ?
      AND s.start_time < ? AND s.end_time > ?`;
    const roomParams = [room, endTime, startTime];

    if (exclude_schedule_id) {
      checkRoomSql += ` AND s.id != ?`;
      roomParams.push(exclude_schedule_id);
    }

    db.query(checkRoomSql, roomParams, (err, roomResults) => {
      if (err) return callback(err);

      if (roomResults && roomResults.length > 0) {
        conflictTypes.push('room');
        conflicts.push({
          type: 'room',
          message: '该诊室在此时间段已被占用',
          conflicting_schedules: roomResults.map(r => ({
            id: r.id,
            customer_name: r.customer_name,
            project: r.project,
            start_time: formatLocalTime(r.start_time),
            end_time: formatLocalTime(r.end_time)
          }))
        });
      }

      callback(null, {
        has_conflict: conflicts.length > 0,
        conflict_types: conflictTypes,
        conflict_details: conflicts,
        skip_conflict_check: false
      });
    });
  });
}

function generateConflictReport(conflictResult) {
  if (!conflictResult.has_conflict) {
    return '该时间段可以预约';
  }

  const messages = [];
  conflictResult.conflict_details.forEach(detail => {
    messages.push(detail.message);
    if (detail.conflicting_schedules && detail.conflicting_schedules.length > 0) {
      const schedule = detail.conflicting_schedules[0];
      messages.push(`冲突排班：${schedule.customer_name}的${schedule.project}，时间：${schedule.start_time} - ${schedule.end_time}`);
    }
  });

  return messages.join('；');
}

module.exports = {
  checkConflict,
  generateConflictReport
};
