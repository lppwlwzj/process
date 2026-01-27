const db = require('../../db/index');
const { needsConflictCheck } = require('./project-type-checker');

function checkConflict(scheduleInfo, callback) {
  const { project, doctor_id, nurse_id, room, start_time, duration, buffer_time, is_vip_priority } = scheduleInfo;

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

  const checkDoctorSql = `SELECT s.id, s.start_time, s.end_time, s.project, c.customer_name
    FROM schedule s
    LEFT JOIN customer c ON s.customer_id = c.id
    WHERE s.doctor_id = ?
    AND (
      (s.start_time < ? AND s.end_time > ?) OR
      (s.start_time < ? AND s.end_time > ?) OR
      (s.start_time >= ? AND s.end_time <= ?)
    )`;

  db.query(checkDoctorSql, [doctor_id, startTime, startTime, endTime, endTime, startTime, endTime], (err, doctorResults) => {
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
          start_time: r.start_time,
          end_time: r.end_time
        }))
      });
    }

    const checkRoomSql = `SELECT s.id, s.start_time, s.end_time, s.project, c.customer_name
      FROM schedule s
      LEFT JOIN customer c ON s.customer_id = c.id
      WHERE s.room = ?
      AND (
        (s.start_time < ? AND s.end_time > ?) OR
        (s.start_time < ? AND s.end_time > ?) OR
        (s.start_time >= ? AND s.end_time <= ?)
      )`;

    db.query(checkRoomSql, [room, startTime, startTime, endTime, endTime, startTime, endTime], (err, roomResults) => {
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
            start_time: r.start_time,
            end_time: r.end_time
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
