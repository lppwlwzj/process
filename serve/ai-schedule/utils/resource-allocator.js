const db = require('../../db/index');
const config = require('../config');

function findAvailableTimeSlots(doctorId, date, duration, callback) {
  const sql = `SELECT start_time, end_time, 
    TIMESTAMPDIFF(MINUTE, end_time, LEAD(start_time) OVER (ORDER BY start_time)) as gap_minutes
    FROM schedule
    WHERE doctor_id = ? AND DATE(start_time) = DATE(?)
    ORDER BY start_time ASC`;

  db.query(sql, [doctorId, date], (err, results) => {
    if (err) return callback(err);

    const availableSlots = [];
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0);

    if (!results || results.length === 0) {
      return callback(null, [{ start_time: startOfDay, end_time: endOfDay }]);
    }

    let currentTime = startOfDay;

    for (let i = 0; i < results.length; i++) {
      const schedule = results[i];
      const scheduleStart = new Date(schedule.start_time);
      const gapMinutes = (scheduleStart - currentTime) / (1000 * 60);

      if (gapMinutes >= duration) {
        availableSlots.push({
          start_time: currentTime,
          end_time: scheduleStart
        });
      }

      currentTime = new Date(schedule.end_time);
    }

    const lastScheduleEnd = new Date(results[results.length - 1].end_time);
    const remainingMinutes = (endOfDay - lastScheduleEnd) / (1000 * 60);
    if (remainingMinutes >= duration) {
      availableSlots.push({
        start_time: lastScheduleEnd,
        end_time: endOfDay
      });
    }

    callback(null, availableSlots);
  });
}

function findAvailableDoctors(date, timeRange, callback) {
  const { start_time, end_time } = timeRange;
  const sql = `SELECT DISTINCT u.id, u.username, COUNT(s.id) as schedule_count
    FROM user u
    LEFT JOIN schedule s ON s.doctor_id = u.id 
      AND DATE(s.start_time) = DATE(?)
      AND (
        (s.start_time < ? AND s.end_time > ?) OR
        (s.start_time < ? AND s.end_time > ?) OR
        (s.start_time >= ? AND s.end_time <= ?)
      )
    WHERE u.role = '医生椅旁技师'
    GROUP BY u.id, u.username
    HAVING COUNT(s.id) = 0
    ORDER BY schedule_count ASC, u.username ASC`;

  db.query(sql, [date, start_time, start_time, end_time, end_time, start_time, end_time], (err, results) => {
    if (err) return callback(err);
    callback(null, results || []);
  });
}

function findAvailableRooms(date, timeRange, callback) {
  const { start_time, end_time } = timeRange;
  const rooms = ['诊室1', '诊室2', '诊室3', '诊室4'];
  
  const sql = `SELECT room, COUNT(*) as usage_count
    FROM schedule
    WHERE DATE(start_time) = DATE(?)
    AND (
      (start_time < ? AND end_time > ?) OR
      (start_time < ? AND end_time > ?) OR
      (start_time >= ? AND end_time <= ?)
    )
    GROUP BY room`;

  db.query(sql, [date, start_time, start_time, end_time, end_time, start_time, end_time], (err, results) => {
    if (err) return callback(err);

    const occupiedRooms = new Set((results || []).map(r => r.room));
    const availableRooms = rooms
      .filter(room => !occupiedRooms.has(room))
      .map(room => ({
        room: room,
        usage_count: 0
      }));

    const roomUsage = {};
    (results || []).forEach(r => {
      roomUsage[r.room] = r.usage_count;
    });

    availableRooms.sort((a, b) => {
      const aUsage = roomUsage[a.room] || 0;
      const bUsage = roomUsage[b.room] || 0;
      return aUsage - bUsage;
    });

    callback(null, availableRooms);
  });
}

function getProjectDefaultDuration(projectType) {
  return config.schedule.defaultDurations[projectType] || 30;
}

module.exports = {
  findAvailableTimeSlots,
  findAvailableDoctors,
  findAvailableRooms,
  getProjectDefaultDuration
};
