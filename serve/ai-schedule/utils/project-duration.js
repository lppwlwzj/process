const db = require('../../db/index');
const config = require('../config');

function getProjectDuration(projectType, callback) {
  if (projectType === '椅旁') {
    return callback(null, null);
  }

  const defaultDuration = config.schedule.defaultDurations[projectType];
  if (defaultDuration) {
    return callback(null, defaultDuration);
  }

  const sql = `SELECT default_duration FROM project_duration_config WHERE project = ?`;
  db.query(sql, [projectType], (err, results) => {
    if (err) return callback(err);
    
    if (results && results.length > 0) {
      callback(null, results[0].default_duration);
    } else {
      callback(null, 30);
    }
  });
}

module.exports = {
  getProjectDuration
};
