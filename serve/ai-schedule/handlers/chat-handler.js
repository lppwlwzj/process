const ScheduleAgent = require('../agent/index');
const { extractScheduleInfo } = require('../parsers/info-extractor');
const { needsConflictCheck, isNoConflictProject } = require('../utils/project-type-checker');
const { checkConflict } = require('../utils/conflict-checker');
const { getProjectDuration } = require('../utils/project-duration');
const { findAvailableRooms, getProjectDefaultDuration } = require('../utils/resource-allocator');
const db = require('../../db/index');

const agent = new ScheduleAgent();

async function processChatMessage(sessionId, userId, message) {
  await agent.initialize();
  
  const extractedInfo = extractScheduleInfo(message);
  const projectType = extractedInfo.project;
  
  if (isNoConflictProject(projectType)) {
    return await handleDirectInsert(sessionId, userId, extractedInfo, message);
  }
  
  const result = await agent.processMessage(sessionId, userId, message);
  
  return {
    session_id: sessionId,
    response: result.response,
    extracted_info: result.extracted_info,
    requires_confirmation: needsConflictCheck(projectType) && !extractedInfo.is_vip_priority,
    has_conflict: false
  };
}

async function* streamChatMessage(sessionId, userId, message) {
  try {
    console.log('streamChatMessage start--->', sessionId, userId, message);
    
    await agent.initialize();
    
    const extractedInfo = extractScheduleInfo(message);
    const projectType = extractedInfo.project;

    console.log('extractedInfo--->', extractedInfo);
    if (isNoConflictProject(projectType)) {
      console.log('isNoConflictProject=true, handling direct insert');
      const result = await handleDirectInsert(sessionId, userId, extractedInfo, message);
      yield { type: 'complete', data: result };
      return;
    }
    
    console.log('calling agent.streamMessage');
    for await (const chunk of agent.streamMessage(sessionId, userId, message)) {
      console.log('yielding chunk--->', chunk);
      yield chunk;
    }
    console.log('streamChatMessage completed');
  } catch (error) {
    console.error('streamChatMessage error--->', error);
    yield { 
      type: 'complete', 
      data: {
        session_id: sessionId,
        response: `处理消息时出错: ${error.message}`,
        extracted_info: {},
        requires_confirmation: false,
        has_conflict: false
      }
    };
  }
}

async function handleDirectInsert(sessionId, userId, extractedInfo, originalMessage) {
  const { project, doctor_name, customer_name, start_time, duration, remark } = extractedInfo;
  
  if (!project || !doctor_name || !customer_name || !start_time) {
    return {
      session_id: sessionId,
      response: '信息不完整，请提供项目类型、医生、客户和开始时间',
      extracted_info: extractedInfo,
      requires_confirmation: false,
      has_conflict: false
    };
  }
  
  const doctorResult = await new Promise((resolve, reject) => {
    db.query('SELECT id FROM user WHERE username LIKE ? AND role = ?', 
      [`%${doctor_name}%`, '医生椅旁技师'], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
  });
  
  if (!doctorResult) {
    return {
      session_id: sessionId,
      response: `未找到医生：${doctor_name}`,
      extracted_info: extractedInfo,
      requires_confirmation: false,
      has_conflict: false
    };
  }
  
  const customerResult = await new Promise((resolve, reject) => {
    db.query('SELECT id FROM customer WHERE customer_name LIKE ?', 
      [`%${customer_name}%`], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
  });
  
  if (!customerResult) {
    return {
      session_id: sessionId,
      response: `未找到客户：${customer_name}`,
      extracted_info: extractedInfo,
      requires_confirmation: false,
      has_conflict: false
    };
  }
  
  const finalDuration = duration || getProjectDefaultDuration(project);
  const startTime = new Date(start_time);
  const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000);
  
  const availableRooms = await new Promise((resolve, reject) => {
    findAvailableRooms(start_time.split(' ')[0], {
      start_time: startTime,
      end_time: endTime
    }, (err, rooms) => {
      if (err) reject(err);
      else resolve(rooms);
    });
  });
  
  const room = availableRooms.length > 0 ? availableRooms[0].room : '诊室1';
  
  const scheduleId = await new Promise((resolve, reject) => {
    db.query(`INSERT INTO schedule 
      (project, doctor_id, customer_id, room, start_time, end_time, duration, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [project, doctorResult.id, customerResult.id, room, startTime, endTime, finalDuration, remark || null],
      (err, results) => {
        if (err) reject(err);
        else resolve(results.insertId);
      });
  });
  
  return {
    session_id: sessionId,
    response: `已成功创建排班：${customer_name}的${project}，时间：${start_time}，诊室：${room}`,
    extracted_info: extractedInfo,
    requires_confirmation: false,
    has_conflict: false,
    schedule_id: scheduleId
  };
}

async function confirmSchedule(sessionId, suggestedSchedule, isVipPriority) {
  const { project, doctor_id, nurse_id, customer_id, room, start_time, duration, remark } = suggestedSchedule;
  
  const startTime = new Date(start_time);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
  
  if (isVipPriority) {
    return await handleVipInsert(sessionId, suggestedSchedule);
  }
  
  return new Promise((resolve, reject) => {
    db.query(`INSERT INTO schedule 
      (project, doctor_id, nurse_id, customer_id, room, start_time, end_time, duration, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project, doctor_id, nurse_id || null, customer_id, room, startTime, endTime, duration, remark || null],
      (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          success: true,
          schedule_id: results.insertId,
          message: '排班创建成功'
        });
      });
  });
}

async function handleVipInsert(sessionId, scheduleInfo) {
  return new Promise((resolve, reject) => {
    const { project, doctor_id, nurse_id, customer_id, room, start_time, duration, remark } = scheduleInfo;
    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    
    db.beginTransaction((err) => {
      if (err) {
        return reject(err);
      }
      
      db.query(`INSERT INTO schedule 
        (project, doctor_id, nurse_id, customer_id, room, start_time, end_time, duration, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project, doctor_id, nurse_id || null, customer_id, room, startTime, endTime, duration, remark || null],
        (err, insertResult) => {
          if (err) {
            return db.rollback(() => reject(err));
          }
          
          const scheduleId = insertResult.insertId;
          
          db.query(`SELECT id, start_time, end_time FROM schedule
            WHERE doctor_id = ? AND room = ? AND DATE(start_time) = DATE(?)
            AND start_time > ?
            ORDER BY start_time ASC`,
            [doctor_id, room, startTime, startTime],
            (err, affectedSchedules) => {
              if (err) {
                return db.rollback(() => reject(err));
              }
              
              let delayAmount = duration;
              const updatePromises = (affectedSchedules || []).map(schedule => {
                const newStartTime = new Date(new Date(schedule.start_time).getTime() + delayAmount * 60 * 1000);
                const newEndTime = new Date(new Date(schedule.end_time).getTime() + delayAmount * 60 * 1000);
                delayAmount += Math.floor((new Date(schedule.end_time) - new Date(schedule.start_time)) / (1000 * 60));
                
                return new Promise((res, rej) => {
                  db.query('UPDATE schedule SET start_time = ?, end_time = ? WHERE id = ?',
                    [newStartTime, newEndTime, schedule.id],
                    (err) => {
                      if (err) rej(err);
                      else res();
                    });
                });
              });
              
              Promise.all(updatePromises)
                .then(() => {
                  db.commit((err) => {
                    if (err) {
                      return db.rollback(() => reject(err));
                    }
                    resolve({
                      success: true,
                      schedule_id: scheduleId,
                      affected_schedules: affectedSchedules.length,
                      message: 'VIP排班创建成功，已顺延受影响排班'
                    });
                  });
                })
                .catch(err => {
                  db.rollback(() => reject(err));
                });
            });
        });
    });
  });
}

module.exports = {
  processChatMessage,
  streamChatMessage,
  confirmSchedule
};
