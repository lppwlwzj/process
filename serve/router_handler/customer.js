const db = require("../db/index");

// 获取客户列表
exports.list = (req, res) => {
  const sql = `SELECT 
    c.*,
    (SELECT technician_video FROM customer_process WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as technician_video
    FROM customer c
    ORDER BY c.created_at DESC`;
  db.query(sql, function (err, results) {
    if (err) return res.cc(err);
    res.send({
      code: 0,
      message: "成功！",
      re: results
    });
  });
};

// 新增客户
exports.create = (req, res) => {
  const {
    customer_name,
    wear_time,
    preparation_time,
    doctor,
    material,
    quantity,
    image,
    qr_code,
    remark
  } = req.body;
  
  if (!customer_name) {
    return res.cc("客户姓名不能为空！");
  }
  
  const sql = `INSERT INTO customer (customer_name, wear_time, preparation_time, doctor, material, quantity, image, qr_code, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [customer_name, wear_time, preparation_time, doctor, material, quantity, image, qr_code, remark], function (err, results) {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("新增客户失败！");
    
    const customerId = results.insertId;
    
    // 同时在 customer_process 表中创建记录
    const processSQL = `INSERT INTO customer_process (customer_id, customer_name, wear_time, progress, material, remark) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(processSQL, [customerId, customer_name, wear_time, 'not_started', material, remark], function (err) {
      if (err) {
        console.error("创建客户进度记录失败:", err);
      }
    });
    
    // 同时在 yipan 表中创建记录
    const yipanSQL = `INSERT INTO yipan (customer_id, customer_name) VALUES (?, ?)`;
    db.query(yipanSQL, [customerId, customer_name], function (err) {
      if (err) {
        console.error("创建椅旁记录失败:", err);
      }
    });
    
    res.send({
      code: 0,
      message: "新增成功！",
      re: { id: customerId }
    });
  });
};

// 更新客户
exports.update = (req, res) => {
  const {
    id,
    customer_name,
    wear_time,
    preparation_time,
    doctor,
    material,
    quantity,
    image,
    qr_code,
    remark
  } = req.body;
  
  if (!id) return res.cc("缺少客户ID！");
  if (!customer_name) return res.cc("客户姓名不能为空！");
  
  const sql = `UPDATE customer SET customer_name=?, wear_time=?, preparation_time=?, doctor=?, material=?, quantity=?, image=?, qr_code=?, remark=? WHERE id=?`;
  db.query(sql, [customer_name, wear_time, preparation_time, doctor, material, quantity, image, qr_code, remark, id], function (err, results) {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("更新客户失败！");
    
    res.send({
      code: 0,
      message: "更新成功！",
      re: null
    });
  });
};

// 删除客户
exports.delete = (req, res) => {
  const { id } = req.body;
  if (!id) return res.cc("缺少客户ID！");
  
  const sql = `DELETE FROM customer WHERE id=?`;
  db.query(sql, id, function (err, results) {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("删除客户失败！");
    
    res.send({
      code: 0,
      message: "删除成功！",
      re: null
    });
  });
};

// 获取客户详情
exports.detail = (req, res) => {
  const { id } = req.body;
  if (!id) return res.cc("缺少客户ID！");
  
  const sql = `SELECT * FROM customer WHERE id=?`;
  db.query(sql, id, function (err, results) {
    if (err) return res.cc(err);
    if (results.length !== 1) return res.cc("客户不存在！");
    
    res.send({
      code: 0,
      message: "成功！",
      re: results[0]
    });
  });
};

