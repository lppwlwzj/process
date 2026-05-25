const db = require('../db/index')

// 添加操作历史记录
exports.addHistory = (req, res) => {
  const { 
    customer_id, 
    customer_name, 
    progress, 
    technician, 
    progress_note,
    start_time 
  } = req.body;
  const progressNote = progress_note === undefined || progress_note === null || progress_note === ""
    ? null
    : String(progress_note);
  
  if (!customer_id || !customer_name || !progress || !technician || !start_time) {
    return res.cc("缺少必要参数！");
  }
  
  const getSameProgressSql = `SELECT id, operation_count FROM customer_process_history 
    WHERE customer_id=? AND progress=? ORDER BY start_time DESC LIMIT 1`;

  const getCountSql = `SELECT COUNT(*) as count FROM customer_process_history WHERE customer_id=?`;

  db.query(getSameProgressSql, [customer_id, progress], (err, sameRows) => {
    if (err) return res.cc(err);

    const existing = sameRows && sameRows[0];
    const existingId = existing ? existing.id : null;

    const getPrevSql = existingId
      ? `SELECT progress, technician, start_time FROM customer_process_history 
         WHERE customer_id=? AND id<>? ORDER BY start_time DESC LIMIT 1`
      : `SELECT progress, technician, start_time FROM customer_process_history 
         WHERE customer_id=? ORDER BY start_time DESC LIMIT 1`;

    const prevParams = existingId ? [customer_id, existingId] : [customer_id];

    db.query(getPrevSql, prevParams, (err, results) => {
      if (err) return res.cc(err);

      let previous_progress = null;
      let previous_technician = null;
      let duration_minutes = null;

      if (results && results.length > 0) {
        const lastRecord = results[0];
        previous_progress = lastRecord.progress;
        previous_technician = lastRecord.technician;
        const lastTime = new Date(lastRecord.start_time);
        const currentTime = new Date(start_time);
        duration_minutes = Math.floor((currentTime - lastTime) / (1000 * 60));
      }

      const finishHistory = (operation_count, historyRowId) => {
        const checkProcessSql = `SELECT id FROM customer_process WHERE customer_id=?`;

        db.query(checkProcessSql, customer_id, (err, processResults) => {
          if (err) return res.cc(err);

          let updateProcessSql;
          let updateParams;

          if (processResults && processResults.length > 0) {
            updateProcessSql = `UPDATE customer_process SET progress=?, technician=?, progress_note=?, updated_at=NOW() WHERE customer_id=?`;
            updateParams = [progress, technician, progressNote, customer_id];
          } else {
            updateProcessSql = `INSERT INTO customer_process (customer_id, progress, technician, progress_note) VALUES (?, ?, ?, ?)`;
            updateParams = [customer_id, progress, technician, progressNote];
          }

          db.query(updateProcessSql, updateParams, (err) => {
            if (err) return res.cc(err);

            res.send({
              code: 0,
              message: "操作记录添加成功！",
              re: {
                id: historyRowId,
                operation_count: operation_count,
                duration_minutes: duration_minutes,
                previous_progress: previous_progress,
                previous_technician: previous_technician
              }
            });
          });
        });
      };

      if (existingId) {
        const operation_count = existing.operation_count;
        const updateHistorySql = `UPDATE customer_process_history SET 
          customer_name=?, technician=?, progress_note=?, operation_count=?, start_time=?, duration_minutes=?, previous_progress=?, previous_technician=? 
          WHERE id=?`;

        db.query(
          updateHistorySql,
          [
            customer_name,
            technician,
            progressNote,
            operation_count,
            start_time,
            duration_minutes,
            previous_progress,
            previous_technician,
            existingId
          ],
          (err, historyResults) => {
            if (err) {
              console.error("更新历史记录失败:", err);
              return res.cc(err);
            }
            if (historyResults.affectedRows !== 1) return res.cc("更新操作记录失败！");
            finishHistory(operation_count, existingId);
          }
        );
        return;
      }

      db.query(getCountSql, customer_id, (err, countResults) => {
        if (err) return res.cc(err);

        const operation_count = (countResults[0].count || 0) + 1;

        const insertSql = `INSERT INTO customer_process_history 
          (customer_id, customer_name, progress, technician, progress_note, operation_count, start_time, duration_minutes, previous_progress, previous_technician) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(
          insertSql,
          [
            customer_id,
            customer_name,
            progress,
            technician,
            progressNote,
            operation_count,
            start_time,
            duration_minutes,
            previous_progress,
            previous_technician
          ],
          (err, historyResults) => {
            if (err) {
              console.error("插入历史记录失败:", err);
              return res.cc(err);
            }
            if (historyResults.affectedRows !== 1) return res.cc("添加操作记录失败！");
            finishHistory(operation_count, historyResults.insertId);
          }
        );
      });
    });
  });
};

// 获取操作历史：可选 customer_id、单日 date、日期范围 start_date+end_date、技工 technician（usercount）、材料 material（customer.materials 中的 material 编码）
exports.getHistory = (req, res) => {
  const { customer_id, date, start_date, end_date, technician, material } = req.body;

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
  if (material !== undefined && material !== null && String(material).trim() !== "") {
    const m = String(material).trim();
    parts.push(
      "(c.materials IS NOT NULL AND c.materials != '' AND JSON_VALID(c.materials) AND JSON_SEARCH(c.materials, 'one', ?, NULL, '$[*].material') IS NOT NULL)"
    );
    params.push(m);
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
