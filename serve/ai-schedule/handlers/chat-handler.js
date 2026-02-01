const ScheduleAgent = require('../agent/index');
const { extractScheduleInfo } = require('../parsers/info-extractor');
const { needsConflictCheck, isNoConflictProject } = require('../utils/project-type-checker');
const { checkConflict, generateConflictReport } = require('../utils/conflict-checker');
const { getProjectDuration } = require('../utils/project-duration');
const { findAvailableRooms, getProjectDefaultDuration } = require('../utils/resource-allocator');
const { matchSimpleIntent } = require('../utils/intent-router');
const db = require('../../db/index');

function hasCompleteScheduleInfo(extractedInfo) {
  const { project, doctor_name, customer_name, start_time } = extractedInfo;
  return !!(project && doctor_name && customer_name && start_time);
}

const agent = new ScheduleAgent();

(async () => {
  try {
    await agent.initialize();
    console.log('Agent 预初始化完成');
  } catch (err) {
    console.error('Agent 预初始化失败:', err);
  }
})();

async function processChatMessage(sessionId, userId, message) {
  const simpleIntent = matchSimpleIntent(message);
  if (simpleIntent.matched) {
    return {
      session_id: sessionId,
      response: simpleIntent.response,
      extracted_info: {},
      requires_confirmation: false,
      has_conflict: false
    };
  }
  
  const extractedInfo = extractScheduleInfo(message);
  
  if (hasCompleteScheduleInfo(extractedInfo)) {
    return await handleDirectCreate(sessionId, userId, extractedInfo);
  }
  
  await agent.initialize();
  const result = await agent.processMessage(sessionId, userId, message);
  
  return {
    session_id: sessionId,
    response: result.response,
    extracted_info: result.extracted_info,
    requires_confirmation: needsConflictCheck(extractedInfo.project) && !extractedInfo.is_vip_priority,
    has_conflict: false
  };
}

async function* streamChatMessage(sessionId, userId, message) {
  try {
    console.log('streamChatMessage start--->', sessionId, userId, message);
    
    const simpleIntent = matchSimpleIntent(message);
    if (simpleIntent.matched) {
      console.log('简单意图匹配成功:', simpleIntent.intent);
      yield { type: 'chunk', content: simpleIntent.response };
      yield { 
        type: 'complete', 
        response: simpleIntent.response, 
        extracted_info: {},
        data: {
          session_id: sessionId,
          response: simpleIntent.response,
          extracted_info: {},
          requires_confirmation: false,
          has_conflict: false
        }
      };
      return;
    }
    
    const extractedInfo = extractScheduleInfo(message);
    const projectType = extractedInfo.project;

    console.log('extractedInfo--->', extractedInfo);
    
    if (hasCompleteScheduleInfo(extractedInfo)) {
      console.log('信息完整，绕过 Agent 直接创建排班');
      const result = await handleDirectCreate(sessionId, userId, extractedInfo);
      yield { type: 'chunk', content: result.response };
      yield { type: 'complete', data: result };
      return;
    }
    
    await agent.initialize();
    
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

async function handleDirectCreate(sessionId, userId, extractedInfo) {
  const { project, doctor_name, nurse_name, customer_name, start_time, duration, room, remark } = extractedInfo;
  
  const findUser = (name, role) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT id, username FROM user WHERE username LIKE ? AND role = ?', 
        [`%${name}%`, role], (err, results) => {
          if (err) reject(err);
          else resolve(results.length > 0 ? results[0] : null);
        });
    });
  };
  
  const doctor = await findUser(doctor_name, '医生椅旁技师');
  if (!doctor) {
    return {
      session_id: sessionId,
      response: `未找到医生：${doctor_name}`,
      extracted_info: extractedInfo,
      requires_confirmation: false,
      has_conflict: false
    };
  }
  
  let nurse = null;
  if (nurse_name) {
    nurse = await findUser(nurse_name, '护士');
  }
  
  const finalDuration = duration || getProjectDefaultDuration(project);
  const startTime = new Date(start_time);
  const endTime = new Date(startTime.getTime() + finalDuration * 60 * 1000);
  
  let finalRoom = room;
  if (!finalRoom) {
    const availableRooms = await new Promise((resolve, reject) => {
      findAvailableRooms(start_time.split(' ')[0], {
        start_time: startTime,
        end_time: endTime
      }, (err, rooms) => {
        if (err) reject(err);
        else resolve(rooms || []);
      });
    });
    finalRoom = availableRooms.length > 0 ? availableRooms[0].room : '诊室1';
  }
  
  const skipConflictCheck = doctor.username === '何锐' || doctor.username === '孙韩宇';
  
  if (needsConflictCheck(project) && !skipConflictCheck) {
    const conflictResult = await new Promise((resolve, reject) => {
      checkConflict({
        project,
        doctor_id: doctor.id,
        nurse_id: nurse?.id,
        room: finalRoom,
        start_time: start_time,
        duration: finalDuration,
        buffer_time: 0,
        is_vip_priority: false
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    if (conflictResult.has_conflict) {
      const report = generateConflictReport(conflictResult);
      return {
        session_id: sessionId,
        response: `排班创建失败：检测到冲突。${report}`,
        extracted_info: extractedInfo,
        requires_confirmation: false,
        has_conflict: true,
        conflict_details: conflictResult.conflict_details
      };
    }
  }
  
  const scheduleId = await new Promise((resolve, reject) => {
    db.query(`INSERT INTO schedule 
      (project, doctor_id, nurse_id, customer_name, room, start_time, end_time, duration, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project, doctor.id, nurse?.id || null, customer_name, finalRoom, startTime, endTime, finalDuration, remark || null],
      (err, results) => {
        if (err) reject(err);
        else resolve(results.insertId);
      });
  });
  
  const formatTime = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  return {
    session_id: sessionId,
    response: `已成功创建排班：${customer_name}的${project}，医生：${doctor.username}，时间：${start_time.split(' ')[0]} ${formatTime(startTime)}-${formatTime(endTime)}，诊室：${finalRoom}`,
    extracted_info: extractedInfo,
    requires_confirmation: false,
    has_conflict: false,
    schedule_id: scheduleId
  };
}

async function handleDirectInsert(sessionId, userId, extractedInfo, originalMessage) {
  return handleDirectCreate(sessionId, userId, extractedInfo);
}

async function confirmSchedule(sessionId, suggestedSchedule, isVipPriority) {
  const { project, doctor_id, nurse_id, customer_name, room, start_time, duration, remark } = suggestedSchedule;
  
  const startTime = new Date(start_time);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
  
  if (isVipPriority) {
    return await handleVipInsert(sessionId, suggestedSchedule);
  }
  
  return new Promise((resolve, reject) => {
    db.query(`INSERT INTO schedule 
      (project, doctor_id, nurse_id, customer_name, room, start_time, end_time, duration, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project, doctor_id, nurse_id || null, customer_name, room, startTime, endTime, duration, remark || null],
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
    const { project, doctor_id, nurse_id, customer_name, room, start_time, duration, remark } = scheduleInfo;
    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    
    db.beginTransaction((err) => {
      if (err) {
        return reject(err);
      }
      
      db.query(`INSERT INTO schedule 
        (project, doctor_id, nurse_id, customer_name, room, start_time, end_time, duration, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project, doctor_id, nurse_id || null, customer_name, room, startTime, endTime, duration, remark || null],
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
