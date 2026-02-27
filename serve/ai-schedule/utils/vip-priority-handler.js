const db = require('../../db/index');

function findAffectedSchedules(doctorId, room, startTime, newEndTime, callback) {
  const sql = `SELECT id, start_time, end_time, duration, room FROM schedule
    WHERE doctor_id = ? AND DATE(start_time) = DATE(?)
    AND start_time < ? AND end_time > ?
    ORDER BY start_time ASC`;
  
  const endTime = newEndTime || new Date(new Date(startTime).getTime() + 70 * 60 * 1000);
  
  db.query(sql, [doctorId, startTime, endTime, startTime], (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results || []);
  });
}

function delaySchedulesSimple(affectedScheduleIds, delayDuration, callback) {
  if (!affectedScheduleIds || affectedScheduleIds.length === 0) {
    return callback(null, { affected_count: 0 });
  }

  let completed = 0;
  let hasError = false;

  affectedScheduleIds.forEach((scheduleId) => {
    if (hasError) return;
    
    db.query('SELECT start_time, end_time, duration FROM schedule WHERE id = ?',
      [scheduleId],
      (err, results) => {
        if (hasError) return;
        if (err) {
          hasError = true;
          return callback(err);
        }

        if (!results || results.length === 0) {
          completed++;
          if (completed === affectedScheduleIds.length) {
            callback(null, { affected_count: completed });
          }
          return;
        }

        const schedule = results[0];
        const currentStartTime = new Date(schedule.start_time);
        const currentEndTime = new Date(schedule.end_time);

        const newStartTime = new Date(currentStartTime.getTime() + delayDuration * 60 * 1000);
        const newEndTime = new Date(currentEndTime.getTime() + delayDuration * 60 * 1000);

        db.query('UPDATE schedule SET start_time = ?, end_time = ? WHERE id = ?',
          [newStartTime, newEndTime, scheduleId],
          (err) => {
            if (hasError) return;
            if (err) {
              hasError = true;
              return callback(err);
            }

            completed++;
            if (completed === affectedScheduleIds.length) {
              callback(null, { affected_count: completed });
            }
          });
      });
  });
}

function delaySchedules(affectedScheduleIds, delayDuration, callback) {
  if (!affectedScheduleIds || affectedScheduleIds.length === 0) {
    return callback(null, { affected_count: 0 });
  }

  db.getConnection((connErr, connection) => {
    if (connErr) {
      return callback(connErr);
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return callback(err);
      }

      let completed = 0;
      let hasError = false;

      affectedScheduleIds.forEach((scheduleId) => {
        if (hasError) return;
        
        connection.query('SELECT start_time, end_time, duration FROM schedule WHERE id = ?',
          [scheduleId],
          (err, results) => {
            if (hasError) return;
            if (err) {
              hasError = true;
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }

            if (!results || results.length === 0) {
              completed++;
              if (completed === affectedScheduleIds.length) {
                connection.commit((err) => {
                  connection.release();
                  if (err) return callback(err);
                  callback(null, { affected_count: completed });
                });
              }
              return;
            }

            const schedule = results[0];
            const currentStartTime = new Date(schedule.start_time);
            const currentEndTime = new Date(schedule.end_time);

            const newStartTime = new Date(currentStartTime.getTime() + delayDuration * 60 * 1000);
            const newEndTime = new Date(currentEndTime.getTime() + delayDuration * 60 * 1000);

            connection.query('UPDATE schedule SET start_time = ?, end_time = ? WHERE id = ?',
              [newStartTime, newEndTime, scheduleId],
              (err) => {
                if (hasError) return;
                if (err) {
                  hasError = true;
                  return connection.rollback(() => {
                    connection.release();
                    callback(err);
                  });
                }

                completed++;
                if (completed === affectedScheduleIds.length) {
                  connection.commit((err) => {
                    connection.release();
                    if (err) return callback(err);
                    callback(null, { affected_count: completed });
                  });
                }
              });
          });
      });
    });
  });
}

function delaySchedulesInTransaction(connection, affectedScheduleIds, newScheduleEndTime, callback) {
  if (!affectedScheduleIds || affectedScheduleIds.length === 0) {
    return callback(null, { affected_count: 0 });
  }

  if (!Array.isArray(affectedScheduleIds)) {
    return callback(new Error('affectedScheduleIds must be an array'));
  }

  connection.query(
    `SELECT id, start_time, end_time, duration FROM schedule WHERE id IN (${affectedScheduleIds.map(() => '?').join(',')}) ORDER BY start_time ASC`,
    affectedScheduleIds,
    (err, schedules) => {
      if (err) {
        return callback(err);
      }

      if (!schedules || schedules.length === 0) {
        return callback(null, { affected_count: 0 });
      }

      let currentStartTime = new Date(newScheduleEndTime);
      let completed = 0;
      let hasError = false;

      schedules.forEach((schedule) => {
        if (hasError) return;

        const duration = schedule.duration;
        const newStartTime = new Date(currentStartTime);
        const newEndTime = new Date(currentStartTime.getTime() + duration * 60 * 1000);

        connection.query('UPDATE schedule SET start_time = ?, end_time = ? WHERE id = ?',
          [newStartTime, newEndTime, schedule.id],
          (err) => {
            if (hasError) return;
            if (err) {
              hasError = true;
              return callback(err);
            }

            completed++;
            if (completed === schedules.length) {
              callback(null, { affected_count: completed });
            }
          });

        currentStartTime = newEndTime;
      });
    }
  );
}

module.exports = {
  findAffectedSchedules,
  delaySchedules,
  delaySchedulesSimple,
  delaySchedulesInTransaction
};
