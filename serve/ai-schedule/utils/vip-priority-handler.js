const db = require('../../db/index');

function findAffectedSchedules(doctorId, room, startTime, callback) {
  const sql = `SELECT id, start_time, end_time, duration FROM schedule
    WHERE doctor_id = ? AND room = ? AND DATE(start_time) = DATE(?)
    AND start_time > ?
    ORDER BY start_time ASC`;

  db.query(sql, [doctorId, room, startTime, startTime], (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results || []);
  });
}

function delaySchedules(affectedScheduleIds, delayDuration, callback) {
  if (!affectedScheduleIds || affectedScheduleIds.length === 0) {
    return callback(null, { affected_count: 0 });
  }

  db.beginTransaction((err) => {
    if (err) {
      return callback(err);
    }

    let completed = 0;
    let totalDelay = delayDuration;

    affectedScheduleIds.forEach((scheduleId, index) => {
      db.query('SELECT start_time, end_time, duration FROM schedule WHERE id = ?',
        [scheduleId],
        (err, results) => {
          if (err) {
            return db.rollback(() => callback(err));
          }

          if (!results || results.length === 0) {
            completed++;
            if (completed === affectedScheduleIds.length) {
              db.commit((err) => {
                if (err) {
                  return db.rollback(() => callback(err));
                }
                callback(null, { affected_count: completed });
              });
            }
            return;
          }

          const schedule = results[0];
          const currentStartTime = new Date(schedule.start_time);
          const currentEndTime = new Date(schedule.end_time);
          const scheduleDuration = schedule.duration || Math.floor((currentEndTime - currentStartTime) / (1000 * 60));

          const newStartTime = new Date(currentStartTime.getTime() + totalDelay * 60 * 1000);
          const newEndTime = new Date(currentEndTime.getTime() + totalDelay * 60 * 1000);

          totalDelay += scheduleDuration;

          db.query('UPDATE schedule SET start_time = ?, end_time = ? WHERE id = ?',
            [newStartTime, newEndTime, scheduleId],
            (err) => {
              if (err) {
                return db.rollback(() => callback(err));
              }

              completed++;
              if (completed === affectedScheduleIds.length) {
                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => callback(err));
                  }
                  callback(null, { affected_count: completed });
                });
              }
            });
        });
    });
  });
}

module.exports = {
  findAffectedSchedules,
  delaySchedules
};
