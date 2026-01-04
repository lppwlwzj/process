const db = require('../db/index')

exports.list = (req, res) => {
  const { customer_name, progress, technician, currentPage = 1, pageSize = 10 } = req.body;
  let sql = `SELECT 
    cp.*,
    y.edge_seating,
    y.occlusion_status
    FROM customer_process cp
    LEFT JOIN yipan y ON cp.customer_id = y.customer_id
    WHERE 1=1`;
  const params = [];

  if (customer_name) {
    sql += ` AND cp.customer_name LIKE ?`;
    params.push(`%${customer_name}%`);
  }
  if (progress) {
    sql += ` AND cp.progress = ?`;
    params.push(progress);
  }
  if (technician) {
    sql += ` AND cp.technician = ?`;
    params.push(technician);
  }

  const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
  db.query(countSql, params, (err, countResults) => {
    if (err) return res.cc(err);
    const total = countResults[0].total;

    sql += ` ORDER BY cp.created_at DESC LIMIT ?, ?`;
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
    material,
    quantity,
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

  const sql = `INSERT INTO customer_process (customer_name, wear_time, progress, technician, material, quantity, image, remark, technician_audio, technician_video, chairside_audio, chairside_video, start_chairside_time, complete_chairside_time, chairside_doctor, daily_wear_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [
    customer_name,
    wear_time || null,
    'not_started',
    technician || null,
    material || null,
    quantity || null,
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
    material,
    quantity,
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

  const sql = `UPDATE customer_process SET customer_name=?, wear_time=?, progress=?, technician=?, material=?, quantity=?, image=?, remark=?, technician_audio=?, technician_video=?, chairside_audio=?, chairside_video=?, start_chairside_time=?, complete_chairside_time=?, chairside_doctor=?, daily_wear_status=? WHERE id=?`;

  db.query(sql, [
    customer_name,
    wear_time || null,
    progress,
    technician || null,
    material || null,
    quantity || null,
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
      c.id as customer_id,
      c.customer_name,
      c.wear_time,
      c.preparation_time,
      c.doctor,
      c.material,
      c.quantity,
      c.image,
      c.qr_code,
      c.remark as customer_note,
      cp.id as process_id,
      cp.progress,
      cp.technician,
      cp.remark,
      cp.technician_audio,
      cp.technician_video,
      cp.created_at as process_created_at,
      cp.updated_at as process_updated_at,
      y.edge_seating,
      y.occlusion_status
    FROM customer c
    LEFT JOIN customer_process cp ON c.id = cp.customer_id
    LEFT JOIN yipan y ON c.id = y.customer_id
    WHERE c.id = ?
    ORDER BY cp.created_at DESC
    LIMIT 1
  `;
  
  db.query(sql, id, (err, results) => {
 
    if (err) return res.cc(err);
    if (results.length === 0) return res.cc("未找到该客户信息！");

    res.send({
      code: 0,
      message: "获取成功！",
      re: results[0]
    });
  });
};

exports.updateTechnicianVideo = (req, res) => {
  const { customer_id, technician_video } = req.body;
  
  if (!customer_id) return res.cc("缺少客户ID！");
  if (!technician_video) return res.cc("缺少视频URL！");
  
  const checkSql = `SELECT id, customer_name FROM customer_process WHERE customer_id=? LIMIT 1`;
  
  db.query(checkSql, [customer_id], (err, results) => {
    if (err) return res.cc(err);
    
    if (results.length > 0) {
      const updateSql = `UPDATE customer_process SET technician_video=? WHERE customer_id=?`;
      db.query(updateSql, [technician_video, customer_id], (err, updateResults) => {
        if (err) return res.cc(err);
        console.log("updateResults--->", updateResults);
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
        const insertSql = `INSERT INTO customer_process (customer_id, customer_name, progress, technician_video) VALUES (?, ?, ?, ?)`;
        db.query(insertSql, [customer_id, customer_name, 'not_started', technician_video], (err, insertResults) => {
          if (err) return res.cc(err);
          res.send({
            message: "保存视频成功！",
            re: null
          });
        });
      });
    }
  });
};

