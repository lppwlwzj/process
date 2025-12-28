const db = require('../db/index')

exports.list = (req, res) => {
  const { customer_name, progress, technician, currentPage = 1, pageSize = 10 } = req.body;
  let sql = `SELECT * FROM customer_process WHERE 1=1`;
  const params = [];

  if (customer_name) {
    sql += ` AND customer_name LIKE ?`;
    params.push(`%${customer_name}%`);
  }
  if (progress) {
    sql += ` AND progress = ?`;
    params.push(progress);
  }
  if (technician) {
    sql += ` AND technician = ?`;
    params.push(technician);
  }

  const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
  db.query(countSql, params, (err, countResults) => {
    if (err) return res.cc(err);
    const total = countResults[0].total;

    sql += ` ORDER BY created_at DESC LIMIT ?, ?`;
    params.push((currentPage - 1) * pageSize, pageSize);

    db.query(sql, params, (err, results) => {
      if (err) return res.cc(err);
      res.send({
        code: 0,
        message: "获取客户进度列表成功！",
        re: {
          list: results,
          total: total,
          currentPage: +currentPage,
          pageSize: +pageSize
        }
      });
    });
  });
};

exports.create = (req, res) => {
  const {
    customer_name,
    wear_time,
    progress,
    technician,
    other_staff,
    material,
    image,
    remark,
    technician_audio,
    technician_video,
    chairside_audio,
    chairside_video,
    start_chairside_time,
    complete_chairside_time,
    chairside_doctor,
    daily_wear_status
  } = req.body;

  if (!customer_name || !progress) {
    return res.cc("客户名称和进度不能为空！");
  }

  const sql = `INSERT INTO customer_process (customer_name, wear_time, progress, technician, other_staff, material, image, remark, technician_audio, technician_video, chairside_audio, chairside_video, start_chairside_time, complete_chairside_time, chairside_doctor, daily_wear_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [
    customer_name,
    wear_time || null,
    progress,
    technician || null,
    other_staff || null,
    material || null,
    image || null,
    remark || null,
    technician_audio || null,
    technician_video || null,
    chairside_audio || null,
    chairside_video || null,
    start_chairside_time || null,
    complete_chairside_time || null,
    chairside_doctor || null,
    daily_wear_status !== undefined ? daily_wear_status : null
  ], (err, results) => {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("新增客户进度失败！");

    res.send({
      code: 0,
      message: "新增成功！",
      re: null
    });
  });
};

exports.update = (req, res) => {
  const {
    id,
    customer_name,
    wear_time,
    progress,
    technician,
    other_staff,
    material,
    image,
    remark,
    technician_audio,
    technician_video,
    chairside_audio,
    chairside_video,
    start_chairside_time,
    complete_chairside_time,
    chairside_doctor,
    daily_wear_status
  } = req.body;

  if (!id) return res.cc("缺少客户进度ID！");
  if (!customer_name || !progress) {
    return res.cc("客户名称和进度不能为空！");
  }

  const sql = `UPDATE customer_process SET customer_name=?, wear_time=?, progress=?, technician=?, other_staff=?, material=?, image=?, remark=?, technician_audio=?, technician_video=?, chairside_audio=?, chairside_video=?, start_chairside_time=?, complete_chairside_time=?, chairside_doctor=?, daily_wear_status=? WHERE id=?`;
  
  db.query(sql, [
    customer_name,
    wear_time || null,
    progress,
    technician || null,
    other_staff || null,
    material || null,
    image || null,
    remark || null,
    technician_audio || null,
    technician_video || null,
    chairside_audio || null,
    chairside_video || null,
    start_chairside_time || null,
    complete_chairside_time || null,
    chairside_doctor || null,
    daily_wear_status !== undefined ? daily_wear_status : null,
    id
  ], (err, results) => {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("更新客户进度失败！");

    res.send({
      code: 0,
      message: "更新成功！",
      re: null
    });
  });
};

exports.delete = (req, res) => {
  const { id } = req.body;
  if (!id) return res.cc("缺少客户进度ID！");

  const sql = `DELETE FROM customer_process WHERE id=?`;
  db.query(sql, id, (err, results) => {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("删除客户进度失败！");

    res.send({
      code: 0,
      message: "删除成功！",
      re: null
    });
  });
};

exports.detail = (req, res) => {
  const { id } = req.body;
  if (!id) return res.cc("缺少客户ID！");

  const sql = `
    SELECT 
      cp.*,
      c.stage,
      c.expected_cut_time,
      c.doctor,
      c.qr_code,
      c.note as customer_note
    FROM customer_process cp
    LEFT JOIN customer c ON cp.customer_id = c.id
    WHERE cp.customer_id = ?
    ORDER BY cp.created_at DESC
    LIMIT 1
  `;
  
  db.query(sql, id, (err, results) => {
    if (err) return res.cc(err);
    if (results.length === 0) return res.cc("未找到该客户的进度信息！");

    res.send({
      code: 0,
      message: "获取成功！",
      re: results[0]
    });
  });
};

