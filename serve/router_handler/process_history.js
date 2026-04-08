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
  
  // 先查询该客户的上一次操作记录和总操作次数
  const getLastSql = `SELECT progress, technician, start_time FROM customer_process_history 
                      WHERE customer_id=? ORDER BY start_time DESC LIMIT 1`;
  
  const getCountSql = `SELECT COUNT(*) as count FROM customer_process_history WHERE customer_id=?`;
  
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
    
    // 查询操作次数
    db.query(getCountSql, customer_id, (err, countResults) => {
      if (err) return res.cc(err);
      
      const operation_count = (countResults[0].count || 0) + 1;
      
      // 插入新的操作记录
      const insertSql = `INSERT INTO customer_process_history 
        (customer_id, customer_name, progress, technician, operation_count, start_time, duration_minutes, previous_progress, previous_technician) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      db.query(insertSql, [
        customer_id,
        customer_name,
        progress,
        technician,
        operation_count,
        start_time,
        duration_minutes,
        previous_progress,
        previous_technician
      ], (err, historyResults) => {
        if (err) {
          console.error('插入历史记录失败:', err);
          return res.cc(err);
        }
        if (historyResults.affectedRows !== 1) return res.cc("添加操作记录失败！");
        
        // 更新或插入 customer_process 表
        const checkProcessSql = `SELECT id FROM customer_process WHERE customer_id=?`;
        
        db.query(checkProcessSql, customer_id, (err, processResults) => {
          if (err) return res.cc(err);
          
          let updateProcessSql;
          let updateParams;
          
          if (processResults && processResults.length > 0) {
            // 如果记录存在，更新
            updateProcessSql = `UPDATE customer_process SET progress=?, technician=?, updated_at=NOW() WHERE customer_id=?`;
            updateParams = [progress, technician, customer_id];
          } else {
            // 如果记录不存在，插入
            updateProcessSql = `INSERT INTO customer_process (customer_id, customer_name, progress, technician) VALUES (?, ?, ?, ?)`;
            updateParams = [customer_id, customer_name, progress, technician];
          }
          
          db.query(updateProcessSql, updateParams, (err, updateResults) => {
            if (err) return res.cc(err);
            
            res.send({
              code: 0,
              message: "操作记录添加成功！",
              re: {
                id: historyResults.insertId,
                operation_count: operation_count,
                duration_minutes: duration_minutes,
                previous_progress: previous_progress,
                previous_technician: previous_technician
              }
            });
          });
        });
      });
    });
  });
};

// 获取操作历史：可选 customer_id、单日 date、日期范围 start_date+end_date、技工 technician（usercount）
exports.getHistory = (req, res) => {
  const { customer_id, date, start_date, end_date, technician } = req.body;

  const parts = [];
  const params = [];

  if (customer_id) {
    parts.push("h.customer_id = ?");
    params.push(customer_id);
  }
  if (start_date && end_date) {
    parts.push("DATE(h.start_time) >= ? AND DATE(h.start_time) <= ?");
    params.push(start_date, end_date);
  } else if (date) {
    parts.push("DATE(h.start_time) = ?");
    params.push(date);
  }
  if (technician) {
    parts.push("h.technician = ?");
    params.push(technician);
  }

  if (parts.length === 0) {
    return res.cc("缺少查询条件！");
  }
  if (!customer_id && !date && !(start_date && end_date)) {
    return res.cc("缺少客户ID或日期！");
  }

  const sql = `SELECT h.*, c.materials AS materials FROM customer_process_history h LEFT JOIN customer c ON h.customer_id = c.id WHERE ${parts.join(" AND ")} ORDER BY h.start_time DESC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.cc(err);

    const rows = (results || []).map((row) => {
      let m = row.materials;
      if (m == null || m === "") {
        return { ...row, materials: [] };
      }
      if (typeof m === "string") {
        try {
          m = JSON.parse(m);
        } catch {
          m = [];
        }
      }
      return { ...row, materials: Array.isArray(m) ? m : [] };
    });

    res.send({
      code: 0,
      message: "获取操作历史成功！",
      re: rows
    });
  });
};
