const db = require("../db/index");
const QRCode = require("qrcode");
const uploadFileToCOS = require("../common/cosUpload");

// 安全解析 JSON 字段的辅助函数
const parseMaterials = (materials) => {
  if (!materials) return [];
  
  // 如果已经是数组或对象，直接返回
  if (typeof materials === 'object') {
    return Array.isArray(materials) ? materials : [];
  }
  
  // 如果是字符串，尝试解析
  if (typeof materials === 'string') {
    try {
      const parsed = JSON.parse(materials);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("解析 materials JSON 失败:", e, "原始值:", materials);
      return [];
    }
  }
  
  return [];
};

// 获取客户列表
exports.list = (req, res) => {
  const { customer_name } = req.body;
  
  let sql = `SELECT 
    c.*,
    (SELECT technician_video FROM customer_process WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as technician_video
    FROM customer c`;
  
  const params = [];
  
  if (customer_name) {
    sql += ` WHERE c.customer_name LIKE ?`;
    params.push(`%${customer_name}%`);
  }
  
  sql += ` ORDER BY c.created_at DESC`;
  
  db.query(sql, params, function (err, results) {
    if (err) return res.cc(err);
    
    // 将 materials JSON 字段解析为数组
    const parsedResults = results.map(item => ({
      ...item,
      materials: parseMaterials(item.materials)
    }));
    
    res.send({
      code: 0,
      message: "成功！",
      re: parsedResults
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
    materials,
    image,
    qr_code,
    remark,
    type
  } = req.body;
  
  if (!customer_name) {
    return res.cc("客户姓名不能为空！");
  }
  
  // 将 materials 数组转换为 JSON 字符串
  const materialsJson = materials ? JSON.stringify(materials) : null;
  
  // 提取材料信息用于同步到 customer_process 表（保持兼容性）
  let materialStr = null;
  if (materials && materials.length > 0) {
    materialStr = materials.map(m => m.material).join(',');
  }
  
  const sql = `INSERT INTO customer (customer_name, wear_time, preparation_time, doctor, materials, image, qr_code, remark, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [customer_name, wear_time, preparation_time, doctor, materialsJson, image, qr_code, remark,type], function (err, results) {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("新增客户失败！");
    
    const customerId = results.insertId;
    
    // 同时在 customer_process 表中创建记录（先检查是否已存在，避免重复）
    const checkProcessSQL = `SELECT id FROM customer_process WHERE customer_id=? LIMIT 1`;
    db.query(checkProcessSQL, customerId, function (err, processResults) {
      if (err) {
        console.error("检查客户进度记录失败:", err);
        return;
      }
      
      if (processResults && processResults.length > 0) {
        // 如果记录已存在，更新而不是插入
        const updateProcessSQL = `UPDATE customer_process SET progress=? WHERE customer_id=?`;
        db.query(updateProcessSQL, ['not_started', customerId], function (err) {
          if (err) {
            console.error("更新客户进度记录失败:", err);
          }
        });
      } else {
        // 如果记录不存在，插入新记录
        const insertProcessSQL = `INSERT INTO customer_process (customer_id, progress) VALUES (?, ?)`;
        db.query(insertProcessSQL, [customerId, 'not_started'], function (err) {
          if (err) {
            console.error("创建客户进度记录失败:", err);
          }
        });
      }
    });
    
    // 同时在 yipan 表中创建记录（先检查是否已存在，避免重复）
    const checkYipanSQL = `SELECT id FROM yipan WHERE customer_id=? LIMIT 1`;
    db.query(checkYipanSQL, customerId, function (err, yipanResults) {
      if (err) {
        console.error("检查椅旁记录失败:", err);
        return;
      }
      
      if (!yipanResults || yipanResults.length === 0) {
        // 如果记录不存在，插入新记录
        const insertYipanSQL = `INSERT INTO yipan (customer_id) VALUES (?)`;
        db.query(insertYipanSQL, [customerId], function (err) {
          if (err) {
            console.error("创建椅旁记录失败:", err);
          }
        });
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
    materials,
    image,
    qr_code,
    remark,
    type
  } = req.body;
  
  if (!id) return res.cc("缺少客户ID！");
  if (!customer_name) return res.cc("客户姓名不能为空！");
  
  // 将 materials 数组转换为 JSON 字符串
  const materialsJson = materials ? JSON.stringify(materials) : null;
  
  const sql = `UPDATE customer SET customer_name=?, wear_time=?, preparation_time=?, doctor=?, materials=?, image=?, qr_code=?, remark=? ,type=? WHERE id=?`;
  db.query(sql, [customer_name, wear_time, preparation_time, doctor, materialsJson, image, qr_code, remark, type, id], function (err, results) {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("更新客户失败！");
    
    res.send({
      code: 0,
      message: "更新成功！",
      re: null
    });
  });
};

exports.updateWearTime = (req, res) => {
  const { id, wear_time } = req.body;
  if (!id) return res.cc("缺少客户ID！");
  const sql = `UPDATE customer SET wear_time=? WHERE id=?`;
  db.query(sql, [wear_time || null, id], function (err, results) {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("更新戴牙时间失败！");
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
  
  const deleteProcessSql = `DELETE FROM customer_process WHERE customer_id=?`;
  db.query(deleteProcessSql, id, function (err, processResults) {
    if (err) return res.cc(err);
    
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
  });
};

exports.batchDelete = (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.cc("缺少客户ID列表！");
  }

  const placeholders = ids.map(() => '?').join(',');
  const deleteProcessSql = `DELETE FROM customer_process WHERE customer_id IN (${placeholders})`;
  
  db.query(deleteProcessSql, ids, (err, processResults) => {
    if (err) return res.cc(err);
    
    const sql = `DELETE FROM customer WHERE id IN (${placeholders})`;
    db.query(sql, ids, (err, results) => {
      if (err) return res.cc(err);
      if (results.affectedRows === 0) return res.cc("删除客户失败！");

      res.send({
        code: 0,
        message: `成功删除 ${results.affectedRows} 条记录！`,
        re: null
      });
    });
  });
};

exports.generateSurveyQrCode = (req, res) => {
  const { id } = req.body;
  if (!id) return res.cc("缺少客户ID！");
  // const surveyUrl = `https://gdcasa.cn/survey/?customer_id=${id}`;
  const surveyUrl = `http://115.159.109.106/survey/?customer_id=${id}`;
  QRCode.toBuffer(surveyUrl, { type: "png", width: 280 })
    .then((buffer) => {
      const fileKey = `survey-qr/${id}.png`;
      return uploadFileToCOS(buffer, fileKey, "image/png").then((location) => `https://${location}`);
    })
    .then((imgUrl) => {
      const sql = `UPDATE customer SET survey_code=? WHERE id=?`;
      db.query(sql, [imgUrl, id], (err) => {
        if (err) return res.cc(err);
        res.send({ code: 0, message: "生成成功！", re: { img: imgUrl } });
      });
    })
    .catch((err) => {
      console.error("生成问卷二维码失败", err);
      res.cc("生成问卷二维码失败", 1);
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
    
    // 将 materials JSON 字段解析为数组
    const customer = {
      ...results[0],
      materials: parseMaterials(results[0].materials)
    };
    
    res.send({
      code: 0,
      message: "成功！",
      re: customer
    });
  });
};


exports.generateQrCode = (req, res) => {
  const { id } = req.body;
  if (!id) return res.cc("缺少客户ID！");
  const url = `http://115.159.109.106/mini/#/?customer_id=${id}`;
  QRCode.toBuffer(url, { type: "png", width: 280 })
    .then((buffer) => {
      const fileKey = `qrCode/${id}.png`;
      return uploadFileToCOS(buffer, fileKey, "image/png").then((location) => `https://${location}`);
    })
    .then((imgUrl) => {
      const sql = `UPDATE customer SET qr_code=? WHERE id=?`;
      db.query(sql, [imgUrl, id], (err) => {
        if (err) return res.cc(err);
        res.send({ code: 0, message: "生成成功！", re: { img: imgUrl } });
      });
    })
    .catch((err) => {
      console.error("生成二维码失败", err);
      res.cc("生成二维码失败", 1);
    });
};