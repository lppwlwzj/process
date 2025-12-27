const db = require("../db/index");

// 获取客户列表
exports.list = (req, res) => {
  const sql = `SELECT * FROM customer ORDER BY created_at DESC`;
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
    stage, 
    wear_time, 
    expected_cut_time, 
    doctor, 
    material, 
    image, 
    qr_code,
    note 
  } = req.body;
  
  if (!customer_name) {
    return res.cc("客户姓名不能为空！");
  }
  
  const sql = `INSERT INTO customer (customer_name, stage, wear_time, expected_cut_time, doctor, material, image, qr_code, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [customer_name, stage, wear_time, expected_cut_time, doctor, material, image, qr_code, note], function (err, results) {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("新增客户失败！");
    
    res.send({
      code: 0,
      message: "新增成功！",
      re: { id: results.insertId }
    });
  });
};

// 更新客户
exports.update = (req, res) => {
  const { 
    id,
    customer_name, 
    stage, 
    wear_time, 
    expected_cut_time, 
    doctor, 
    material, 
    image, 
    qr_code,
    note 
  } = req.body;
  
  if (!id) return res.cc("缺少客户ID！");
  if (!customer_name) return res.cc("客户姓名不能为空！");
  
  const sql = `UPDATE customer SET customer_name=?, stage=?, wear_time=?, expected_cut_time=?, doctor=?, material=?, image=?, qr_code=?, note=? WHERE id=?`;
  db.query(sql, [customer_name, stage, wear_time, expected_cut_time, doctor, material, image, qr_code, note, id], function (err, results) {
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
