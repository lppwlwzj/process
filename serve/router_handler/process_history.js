const db = require('../db/index')

// 添加操作历史记录
exports.addHistory = (req, res) => {
  const { 
    customer_id, 
    customer_name, 
    progress, 
    technician, 
    start_time 
  } = req.body;
  
  if (!customer_id || !customer_name || !progress || !technician || !start_time) {
    return res.cc("缺少必要参数！");
  }
  
  // 先查询该客户的上一次操作记录
  const getLastSql = `SELECT progress, technician, start_time FROM customer_process_history 
                      WHERE customer_id=? ORDER BY start_time DESC LIMIT 1`;
  
  db.query(getLastSql, customer_id, (err, results) => {
    if (err) return res.cc(err);
    
    let previous_progress = null;
    let previous_technician = null;
    let duration_minutes = null;
    
    // 如果有上一次记录，计算时间差
    if (results && results.length > 0) {
      const lastRecord = results[0];
      previous_progress = lastRecord.progress;
      previous_technician = lastRecord.technician;
      
      // 计算时间差（分钟）
      const lastTime = new Date(lastRecord.start_time);
      const currentTime = new Date(start_time);
      duration_minutes = Math.floor((currentTime - lastTime) / (1000 * 60));
    }
    
    // 插入新的操作记录
    const insertSql = `INSERT INTO customer_process_history 
      (customer_id, customer_name, progress, technician, start_time, duration_minutes, previous_progress, previous_technician) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(insertSql, [
      customer_id,
      customer_name,
      progress,
      technician,
      start_time,
      duration_minutes,
      previous_progress,
      previous_technician
    ], (err, results) => {
      if (err) return res.cc(err);
      if (results.affectedRows !== 1) return res.cc("添加操作记录失败！");
      
      res.send({
        code: 0,
        message: "操作记录添加成功！",
        re: {
          id: results.insertId,
          duration_minutes: duration_minutes,
          previous_progress: previous_progress,
          previous_technician: previous_technician
        }
      });
    });
  });
};

// 获取客户的操作历史列表
exports.getHistory = (req, res) => {
  const { customer_id } = req.body;
  
  if (!customer_id) {
    return res.cc("缺少客户ID！");
  }
  
  const sql = `SELECT * FROM customer_process_history WHERE customer_id=? ORDER BY start_time DESC`;
  
  db.query(sql, customer_id, (err, results) => {
    if (err) return res.cc(err);
    
    res.send({
      code: 0,
      message: "获取操作历史成功！",
      re: results
    });
  });
};
