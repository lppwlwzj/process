const db = require("../db/index");

exports.add = (req, res) => {
  const yipanInfo = req.body;
  
  const sql = `INSERT INTO yipan SET ?`;
  
  db.query(sql, yipanInfo, function (err, results) {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("新增椅旁记录失败！");
    res.send({
      code: 0,
      message: "新增椅旁记录成功！",
      re: { id: results.insertId }
    });
  });
};

exports.detail = (req, res) => {
  const { customer_id } = req.body;
  
  if (!customer_id) {
    return res.cc("客户ID不能为空");
  }
  
  const sql = `SELECT * FROM yipan WHERE customer_id = ? ORDER BY updated_at DESC LIMIT 1`;
  
  db.query(sql, [customer_id], function (err, results) {
    if (err) return res.cc(err);
    
    if (results.length === 0) {
      return res.send({
        code: 0,
        message: "未找到该客户的椅旁记录",
        re: null
      });
    }
    
    res.send({
      code: 0,
      message: "获取椅旁记录成功",
      re: results[0]
    });
  });
};

exports.startChairside = (req, res) => {
  const { customer_id, chairside_doctor } = req.body;
  
  if (!customer_id || !chairside_doctor) {
    return res.cc("客户ID和椅旁医生不能为空");
  }
  
  const checkSql = `SELECT * FROM yipan WHERE customer_id = ?`;
  
  db.query(checkSql, [customer_id], function (err, results) {
    if (err) return res.cc(err);
    
    if (results.length === 0) {
      return res.cc("未找到该客户的椅旁记录");
    }
    
    const yipanRecord = results[0];
    
    if (yipanRecord.start_time) {
      return res.cc(`医生${yipanRecord.chairside_doctor}正在进行椅旁操作，请先完成后再开始新的椅旁`);
    }
    
    const updateSql = `UPDATE yipan SET chairside_doctor = ?, start_time = NOW() WHERE customer_id = ?`;
    
    db.query(updateSql, [chairside_doctor, customer_id], function (err, updateResults) {
      if (err) return res.cc(err);
      if (updateResults.affectedRows === 0) return res.cc("开始椅旁操作失败！");
      
      res.send({
        code: 0,
        message: "开始椅旁操作成功",
        re: {
          chairside_doctor,
          start_time: new Date()
        }
      });
    });
  });
};

exports.completeChairside = (req, res) => {
  const { customer_id } = req.body;
  
  if (!customer_id) {
    return res.cc("客户ID不能为空");
  }
  
  const checkSql = `
    SELECT y.*, cp.progress 
    FROM yipan y 
    LEFT JOIN customer_process cp ON y.customer_id = cp.customer_id 
    WHERE y.customer_id = ?
  `;
  
  db.query(checkSql, [customer_id], function (err, results) {
    if (err) return res.cc(err);
    
    if (results.length === 0) {
      return res.cc("未找到该客户的椅旁记录");
    }
    
    const yipanRecord = results[0];
    
    if (!yipanRecord.start_time) {
      return res.cc("该客户尚未开始椅旁操作，无法完成");
    }
    
    const startTime = new Date(yipanRecord.start_time);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    
    const insertHistorySql = `
      INSERT INTO yipan_history 
      (customer_id, customer_name, progress, chairside_doctor, start_time, end_time, duration_minutes) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const historyParams = [
      customer_id,
      yipanRecord.customer_name,
      yipanRecord.progress || '未知',
      yipanRecord.chairside_doctor,
      yipanRecord.start_time,
      endTime,
      durationMinutes
    ];
    
    db.query(insertHistorySql, historyParams, function (err, historyResults) {
      if (err) return res.cc(err);
      
      const clearStartTimeSql = `UPDATE yipan SET start_time = NULL WHERE customer_id = ?`;
      
      db.query(clearStartTimeSql, [customer_id], function (err, updateResults) {
        if (err) return res.cc(err);
        
        res.send({
          code: 0,
          message: "完成椅旁操作成功",
          re: {
            history_id: historyResults.insertId,
            chairside_doctor: yipanRecord.chairside_doctor,
            start_time: yipanRecord.start_time,
            end_time: endTime,
            duration_minutes: durationMinutes
          }
        });
      });
    });
  });
};

exports.update = (req, res) => {
  const yipanInfo = req.body;
  
  if (!yipanInfo.id && !yipanInfo.customer_id) {
    return res.cc("缺少更新条件：需要提供id或customer_id");
  }
  
  const { id, customer_id, ...updateFields } = yipanInfo;
  
  let sql;
  let params;
  
  if (id) {
    sql = `UPDATE yipan SET ? WHERE id = ?`;
    params = [updateFields, id];
  } else {
    sql = `UPDATE yipan SET ? WHERE customer_id = ?`;
    params = [updateFields, customer_id];
  }
  
  db.query(sql, params, function (err, results) {
    if (err) return res.cc(err);
    if (results.affectedRows === 0) return res.cc("更新椅旁记录失败！");
    res.send({
      code: 0,
      message: "更新椅旁记录成功！"
    });
  });
};

exports.list = (req, res) => {
  const { customer_id } = req.body;
  
  let sql = `SELECT * FROM yipan`;
  let params = [];
  
  if (customer_id) {
    sql += ` WHERE customer_id = ?`;
    params.push(customer_id);
  }
  
  sql += ` ORDER BY updated_at DESC`;
  
  db.query(sql, params, function (err, results) {
    if (err) return res.cc(err);
    res.send({
      code: 0,
      message: "获取椅旁记录列表成功",
      re: results
    });
  });
};

exports.updateChairsideVideo = (req, res) => {
  const { customer_id, chairside_video } = req.body;
  
  if (!customer_id) return res.cc("缺少客户ID！");
  if (!chairside_video) return res.cc("缺少视频URL！");
  
  const checkSql = `SELECT id, customer_name FROM yipan WHERE customer_id=? LIMIT 1`;
  
  db.query(checkSql, [customer_id], (err, results) => {
    if (err) return res.cc(err);
    
    if (results.length > 0) {
      const updateSql = `UPDATE yipan SET chairside_video=? WHERE customer_id=?`;
      db.query(updateSql, [chairside_video, customer_id], (err, updateResults) => {
        if (err) return res.cc(err);
        res.send({
          code: 0,
          message: "更新视频成功！",
          re: null
        });
      });
    } else {
      const getCustomerSql = `SELECT customer_name FROM customer WHERE id=? LIMIT 1`;
      db.query(getCustomerSql, [customer_id], (err, customerResults) => {
        if (err) return res.cc(err);
        if (customerResults.length === 0) return res.cc("客户不存在！");
        
        const customer_name = customerResults[0].customer_name;
        const insertSql = `INSERT INTO yipan (customer_id, customer_name, chairside_video) VALUES (?, ?, ?)`;
        db.query(insertSql, [customer_id, customer_name, chairside_video], (err, insertResults) => {
          if (err) return res.cc(err);
          res.send({
            code: 0,
            message: "保存视频成功！",
            re: null
          });
        });
      });
    }
  });
};

exports.getHistory = (req, res) => {
  const { customer_id } = req.body;
  
  let sql = `SELECT * FROM yipan_history`;
  let params = [];
  
  if (customer_id) {
    sql += ` WHERE customer_id = ?`;
    params.push(customer_id);
  }
  
  sql += ` ORDER BY start_time DESC`;
  
  db.query(sql, params, function (err, results) {
    if (err) return res.cc(err);
    res.send({
      code: 0,
      message: "获取椅旁历史记录成功",
      re: results
    });
  });
};
