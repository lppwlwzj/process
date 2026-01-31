const db = require('../../db/index');
const config = require('../config');

function saveMessage(sessionId, userId, role, content, metadata, callback) {
  const sql = `INSERT INTO conversation_memory 
    (session_id, user_id, role, content, metadata)
    VALUES (?, ?, ?, ?, ?)`;

  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  db.query(sql, [sessionId, userId, role, content, metadataJson], (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results.insertId);
  });
}

function getRecentMessages(sessionId, limit, callback) {
  const maxMessages = limit || config.memory.maxMessagesPerSession;
  const sql = `SELECT id, role, content, metadata, created_at
    FROM conversation_memory
    WHERE session_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?`;

  db.query(sql, [sessionId, maxMessages], (err, results) => {
    if (err) {
      return callback(err);
    }
    const messages = (results || []).reverse().map(msg => {
      let metadata = null;
      if (msg.metadata) {
        if (typeof msg.metadata === 'string') {
          try {
            metadata = JSON.parse(msg.metadata);
          } catch (e) {
            console.warn('Failed to parse metadata JSON:', e.message, 'metadata:', msg.metadata);
            metadata = null;
          }
        } else if (typeof msg.metadata === 'object') {
          metadata = msg.metadata;
        }
      }
      return {
        role: msg.role,
        content: msg.content,
        metadata: metadata
      };
    });
    callback(null, messages);
  });
}

function cleanupOldMessages(callback) {
  const retentionDays = config.memory.retentionDays;
  const sql = `DELETE FROM conversation_memory
    WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`;

  db.query(sql, [retentionDays], (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results.affectedRows);
  });
}

function deleteSession(sessionId, callback) {
  const sql = `DELETE FROM conversation_memory WHERE session_id = ?`;
  db.query(sql, [sessionId], (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results.affectedRows);
  });
}

module.exports = {
  saveMessage,
  getRecentMessages,
  cleanupOldMessages,
  deleteSession
};
