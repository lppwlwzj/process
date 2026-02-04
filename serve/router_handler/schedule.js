const db = require('../db/index')
const { findAvailableRooms } = require('../ai-schedule/utils/resource-allocator')

exports.list = (req, res) => {
  const { date, dateRange, doctor_id } = req.body;
  let sql = `SELECT 
    s.*,
    u1.username as doctor_name,
    u2.username as nurse_name
    FROM schedule s
    LEFT JOIN user u1 ON s.doctor_id = u1.id
    LEFT JOIN user u2 ON s.nurse_id = u2.id
    WHERE 1=1`;
  const params = [];
  
  if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
    sql += ` AND DATE(s.start_time) >= ? AND DATE(s.start_time) <= ?`;
    params.push(dateRange[0], dateRange[1]);
  } else if (date) {
    sql += ` AND DATE(s.start_time) = ?`;
    params.push(date);
  }
  
  if (doctor_id) {
    sql += ` AND s.doctor_id = ?`;
    params.push(doctor_id);
  }
  
  sql += ` ORDER BY s.start_time ASC`;
  
  db.query(sql, params, (err, results) => {
    if (err) return res.cc(err);
    res.send({
      code: 0,
      message: "成功！",
      re: results
    });
  });
};

exports.create = (req, res) => {
  const { project , doctor_id , nurse_id, customer_name, room, start_time , duration = 0, remark } = req.body;
  
  const finalCustomerName = customer_name 
  //休息 填写在备注里
   const isRest = remark && remark.includes('休息') && !project && !doctor_id && !finalCustomerName;
  // if (duration <= 0) {
  //   return res.cc("时长必须大于0！");
  // }
  
  const startTime = new Date(start_time);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
  
  // const checkRoomSql = `SELECT id FROM schedule 
  //   WHERE room = ? 
  //   AND (
  //     (start_time <= ? AND end_time > ?) OR
  //     (start_time < ? AND end_time >= ?) OR
  //     (start_time >= ? AND end_time <= ?)
  //   )`;
  
  // conflictChecks.push({
  //   sql: checkRoomSql,
  //   params: [room, startTime, startTime, endTime, endTime, startTime, endTime],
  //   message: "该诊室在此时间段已被占用，请选择其他诊室或时间！"
  // });
  
  // let completedChecks = 0;
  // const totalChecks = conflictChecks.length;

  // 如果未指定诊室，自动分配空闲诊室
  const allocateRoom = (callback) => {
    if (isRest) {
      return callback(null, null);
    }
    if (room) {
      // 如果指定了诊室，直接使用
      return callback(null, room);
    }
    
    // 查找空闲诊室
    findAvailableRooms(start_time, { start_time: startTime, end_time: endTime }, (err, availableRooms) => {
      if (err) {
        return callback(err);
      }
      
      if (!availableRooms || availableRooms.length === 0) {
        const timeStr = startTime.toISOString().replace('T', ' ').slice(0, 19);
        return callback(new Error(`该时间段（${timeStr}）没有空闲的诊室，请选择其他时间`));
      }
      
      // 选择使用频率最低的空闲诊室（已排序）
      callback(null, availableRooms[0].room);
    });
  };
  
  allocateRoom((err, finalRoom) => {
    if (err) {
      return res.cc(err.message);
    }
    
    // 先查询医生名，判断是否需要检查冲突
    const getDoctorNameSql = `SELECT username FROM user WHERE id = ?`;
    db.query(getDoctorNameSql, [doctor_id], (err, doctorResult) => {
      if (err) return res.cc(err);
      
      const doctorName = doctorResult && doctorResult.length > 0 ? doctorResult[0].username : '';
      const skipConflictCheck = doctorName === '何锐' || doctorName === '孙韩宇';
      
      if (skipConflictCheck) {
        // 如果是何锐或孙韩宇，直接插入，不检查冲突
        const insertSql = `INSERT INTO schedule 
          (project, doctor_id, nurse_id, customer_name, room, start_time, duration, end_time, remark) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const insertParams = [project, doctor_id, nurse_id || null, finalCustomerName, finalRoom, startTime, duration, endTime, remark || null];
        
        db.query(insertSql, insertParams, (err, results) => {
          if (err) return res.cc(err);
          res.send({
            code: 0,
            message: "创建排班成功！",
            re: { id: results.insertId }
          });
        });
        return;
      }
      
      // 其他医生需要检查冲突
      const conflictChecks = [];
      const conflictMessages = [];
      
      const checkDoctorSql = `SELECT s.id, s.start_time, s.end_time, s.customer_name, s.project, u.username as doctor_name
        FROM schedule s
        LEFT JOIN user u ON s.doctor_id = u.id
        WHERE s.doctor_id = ? 
        AND (s.remark IS NULL OR s.remark NOT LIKE '%休息%')
        AND (
          (s.start_time <= ? AND s.end_time > ?) OR
          (s.start_time < ? AND s.end_time >= ?) OR
          (s.start_time >= ? AND s.end_time <= ?)
        )
        ORDER BY s.start_time ASC`;
      
  
      
      conflictChecks.push({
        sql: checkDoctorSql,
        params: [doctor_id, startTime, startTime, endTime, endTime, startTime, endTime],
        message: "该医生在此时间段已有排班！",
        type: 'doctor'
      });
    // if (nurse_id) {
    //   const checkNurseSql = `SELECT id FROM schedule 
    //     WHERE nurse_id = ? 
    //     AND (
    //       (start_time <= ? AND end_time > ?) OR
    //       (start_time < ? AND end_time >= ?) OR
    //       (start_time >= ? AND end_time <= ?)
    //     )`;
      
    //   conflictChecks.push({
    //     sql: checkNurseSql,
    //     params: [nurse_id, startTime, startTime, endTime, endTime, startTime, endTime],
    //     message: "该护士在此时间段已有排班，请选择其他时间！"
    //   });
    // }
    
    // 移除诊室冲突检测，因为会自动分配空闲诊室
      
      let completedChecks = 0;
      const totalChecks = conflictChecks.length;
      
      if (totalChecks === 0) {
        // 如果没有冲突检测，直接插入
        const insertSql = `INSERT INTO schedule 
          (project, doctor_id, nurse_id, customer_name, room, start_time, duration, end_time, remark) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const insertParams = [project, doctor_id, nurse_id || null, finalCustomerName, finalRoom, startTime, duration, endTime, remark || null];
        
        db.query(insertSql, insertParams, (err, results) => {
          if (err) return res.cc(err);
          res.send({
            code: 0,
            message: "创建排班成功！",
            re: { id: results.insertId }
          });
        });
        return;
      }
      
      conflictChecks.forEach((check, index) => {
        db.query(check.sql, check.params, (err, conflictResults) => {
          if (err) return res.cc(err);
          
          if (conflictResults.length > 0) {
            let message = check.message;
            if (check.type === 'doctor') {
              const conflictList = conflictResults.map(item => {
                const start = new Date(item.start_time);
                const end = new Date(item.end_time);
                const formatTime = (date) => {
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const hour = String(date.getHours()).padStart(2, '0');
                  const minute = String(date.getMinutes()).padStart(2, '0');
                  return `${month}-${day} ${hour}:${minute}`;
                };
                const startStr = formatTime(start);
                const endStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
                return `${startStr}-${endStr} <br>${item.doctor_name}、${item.customer_name}、${item.project}`;
              }).join('<br>');
              message = `${check.message}<br><br>${conflictList} <br> <br> ${`备牙: 70min  <br>戴牙: 90min  <br>复诊: 30min`}`;
            }
            conflictMessages.push(message.replace(/\n/g, '<br>'));
          }
          
          completedChecks++;
          
          if (completedChecks === totalChecks) {
            if (conflictMessages.length > 0) {
              return res.cc(conflictMessages.join("；"));
            }
            
            const insertSql = `INSERT INTO schedule 
              (project, doctor_id, nurse_id, customer_name, room, start_time, duration, end_time, remark) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const insertParams = [project, doctor_id, nurse_id || null, finalCustomerName, finalRoom, startTime, duration, endTime, remark || null];
            
            db.query(insertSql, insertParams, (err, results) => {
              if (err) return res.cc(err);
              res.send({
                code: 0,
                message: "创建排班成功！",
                re: { id: results.insertId }
              });
            });
          }
        });
      });
    });
  });
};

exports.update = (req, res) => {
  const { id, project, doctor_id, nurse_id, customer_name, room, start_time, duration, remark } = req.body;
  
  if (!id) {
    return res.cc("缺少排班ID！");
  }
  
  // if (!project || !doctor_id   || !start_time ) {
  //   return res.cc("缺少必填字段！");
  // }
  
  // if (duration <= 0) {
  //   return res.cc("时长必须大于0！");
  // }
  
  const startTime = new Date(start_time);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
  
  // 先查询医生名，判断是否需要检查冲突
  const getDoctorNameSql = `SELECT username FROM user WHERE id = ?`;
  db.query(getDoctorNameSql, [doctor_id], (err, doctorResult) => {
    if (err) return res.cc(err);
    
    const doctorName = doctorResult && doctorResult.length > 0 ? doctorResult[0].username : '';
    const skipConflictCheck = doctorName === '何锐' || doctorName === '孙韩宇';
    
    if (skipConflictCheck) {
      // 如果是何锐或孙韩宇，直接更新，不检查冲突
      const updateSql = `UPDATE schedule 
        SET project = ?, doctor_id = ?, nurse_id = ?, customer_name = ?, room = ?,
            start_time = ?, duration = ?, end_time = ?, remark = ?
        WHERE id = ?`;
      
      const updateParams = [project, doctor_id, nurse_id || null, customer_name, room, startTime, duration, endTime, remark || null, id];
      
      db.query(updateSql, updateParams, (err, results) => {
        if (err) return res.cc(err);
        res.send({
          code: 0,
          message: "更新排班成功！",
          re: null
        });
      });
      return;
    }
    
    // 其他医生需要检查冲突
    const conflictChecks = [];
    const conflictMessages = [];
    
    const checkDoctorSql = `SELECT s.id, s.start_time, s.end_time, s.customer_name, s.project, u.username as doctor_name
      FROM schedule s
      LEFT JOIN user u ON s.doctor_id = u.id
      WHERE s.doctor_id = ? 
      AND s.id != ?
      AND (s.remark IS NULL OR s.remark NOT LIKE '%休息%')
      AND (
        (s.start_time <= ? AND s.end_time > ?) OR
        (s.start_time < ? AND s.end_time >= ?) OR
        (s.start_time >= ? AND s.end_time <= ?)
      )
      ORDER BY s.start_time ASC`;
    
    conflictChecks.push({
      sql: checkDoctorSql,
      params: [doctor_id, id, startTime, startTime, endTime, endTime, startTime, endTime],
      message: "该医生在此时间段已有排班，请选择其他时间！",
      type: 'doctor'
    });
    
    const checkRoomSql = `SELECT s.id, s.start_time, s.end_time, s.customer_name, s.project, u.username as doctor_name
      FROM schedule s
      LEFT JOIN user u ON s.doctor_id = u.id
      WHERE s.room = ? 
      AND s.id != ?
      AND (
        (s.start_time <= ? AND s.end_time > ?) OR
        (s.start_time < ? AND s.end_time >= ?) OR
        (s.start_time >= ? AND s.end_time <= ?)
      )
      ORDER BY s.start_time ASC`;
    
    conflictChecks.push({
      sql: checkRoomSql,
      params: [room, id, startTime, startTime, endTime, endTime, startTime, endTime],
      message: "该诊室在此时间段已被占用，请选择其他诊室或时间！",
      type: 'room'
    });
    
    let completedChecks = 0;
    const totalChecks = conflictChecks.length;
    
    conflictChecks.forEach((check, index) => {
      db.query(check.sql, check.params, (err, conflictResults) => {
        if (err) return res.cc(err);
        
        if (conflictResults.length > 0) {
          let message = check.message;
          if (check.type === 'doctor' || check.type === 'room') {
            const conflictList = conflictResults.map(item => {
              const start = new Date(item.start_time);
              const end = new Date(item.end_time);
              const formatTime = (date) => {
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hour = String(date.getHours()).padStart(2, '0');
                const minute = String(date.getMinutes()).padStart(2, '0');
                return `${month}-${day} ${hour}:${minute}`;
              };
              const startStr = formatTime(start);
              const endStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
              return `${startStr}-${endStr} <br>${item.doctor_name}、${item.customer_name}、${item.project}`;
            }).join('<br>');
            message = `${check.message} <br>${conflictList}<br> <br> ${`备牙: 70min  <br>戴牙: 90min  <br>复诊: 30min`}`;
          }
          conflictMessages.push(message);
        }
        
        completedChecks++;
        
        if (completedChecks === totalChecks) {
          if (conflictMessages.length > 0) {
            return res.cc(conflictMessages.join("；"));
          }
          
          const updateSql = `UPDATE schedule 
            SET project = ?, doctor_id = ?, nurse_id = ?, customer_name = ?, room = ?,
                start_time = ?, duration = ?, end_time = ?, remark = ?
            WHERE id = ?`;
          
          const updateParams = [project, doctor_id, nurse_id || null, customer_name, room, startTime, duration, endTime, remark || null, id];
          
          db.query(updateSql, updateParams, (err, results) => {
            if (err) return res.cc(err);
            res.send({
              code: 0,
              message: "更新排班成功！",
              re: null
            });
          });
        }
      });
    });
  });
};

exports.delete = (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.cc("缺少排班ID！");
  }
  
  const deleteSql = `DELETE FROM schedule WHERE id = ?`;
  
  db.query(deleteSql, [id], (err, results) => {
    if (err) return res.cc(err);
    res.send({
      code: 0,
      message: "删除排班成功！",
      re: null
    });
  });
};

exports.detail = (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.cc("缺少排班ID！");
  }
  
  const sql = `SELECT 
    s.*,
    u1.username as doctor_name,
    u2.username as nurse_name
    FROM schedule s
    LEFT JOIN user u1 ON s.doctor_id = u1.id
    LEFT JOIN user u2 ON s.nurse_id = u2.id
    WHERE s.id = ?`;
  
  db.query(sql, [id], (err, results) => {
    if (err) return res.cc(err);
    if (results.length === 0) {
      return res.cc("排班记录不存在！");
    }
    res.send({
      code: 0,
      message: "成功！",
      re: results[0]
    });
  });
};

exports.getLastPreparationDoctor = (req, res) => {
  const { customer_name } = req.body;
  
  if (!customer_name) {
    return res.cc("缺少客户姓名！");
  }
  
  const sql = `SELECT 
    s.doctor_id,
    u1.username as doctor_name
    FROM schedule s
    LEFT JOIN user u1 ON s.doctor_id = u1.id
    WHERE s.customer_name = ? AND s.project = '备牙'
    ORDER BY s.start_time DESC
    LIMIT 1`;
  
  db.query(sql, [customer_name], (err, results) => {
    if (err) return res.cc(err);
    if (results.length === 0) {
      res.send({
        code: 0,
        message: "未找到该客户的备牙记录",
        re: null
      });
    } else {
      res.send({
        code: 0,
        message: "成功！",
        re: results[0]
      });
    }
  });
};
