const db = require('../db/index')

exports.list = (req, res) => {
  const { customer_name, progress, technician, remark, wear_time, preparation_time, type, currentPage = 1, pageSize = 10 } = req.body;
  let sql = `SELECT 
    cp.*,
    c.customer_name,
    c.type,
    c.materials,
    c.wear_time,
    c.preparation_time,
    c.remark,
    y.edge_seating,
    y.occlusion_status,
    y.chairside_video,
    y.color_status
    FROM customer_process cp
    LEFT JOIN customer c ON cp.customer_id = c.id
    LEFT JOIN yipan y ON cp.customer_id = y.customer_id
    WHERE 1=1`;
  const params = [];
  if(type) {
    sql += ` AND c.type = ?`;
    params.push(type);
  }

  if (wear_time) {
    sql += ` AND c.wear_time = ? `;
    params.push(wear_time);
  } else if (preparation_time) {
    sql += ` AND c.preparation_time = ?`;
    params.push(preparation_time);
  } else {
    if (customer_name) {
      sql += ` AND c.customer_name LIKE ?`;
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
    if (remark) {
      sql += ` AND (cp.remark LIKE ? OR c.remark LIKE ?)`;
      params.push(`%${remark}%`, `%${remark}%`);
    }
  }

  const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
  const orderBySql = ` ORDER BY 
    CASE
      WHEN cp.progress != 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN 1
      WHEN c.wear_time = DATE_FORMAT(CURDATE(), '%m-%d') THEN 2
      WHEN cp.progress = 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN 4
      ELSE 3
    END ASC,
    CASE
      WHEN cp.progress != 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN c.wear_time
      WHEN cp.progress = 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN NULL
      WHEN c.wear_time = DATE_FORMAT(CURDATE(), '%m-%d') THEN NULL
      WHEN c.wear_time IS NULL THEN '99-99'
      ELSE c.wear_time
    END ASC,
    CASE
      WHEN cp.progress = 'completed' AND c.wear_time IS NOT NULL AND c.wear_time < DATE_FORMAT(CURDATE(), '%m-%d') THEN c.wear_time
      ELSE NULL
    END DESC`;

  db.query(countSql, params, (err, countResults) => {
    if (err) return res.cc(err);
    const total = countResults[0].total;

    const allDataSql = sql + orderBySql;
    const paginatedSql = sql + orderBySql + ` LIMIT ?, ?`;
    const paginatedParams = [...params, (currentPage - 1) * pageSize, pageSize];

    const parseMaterials = (results) => {
      return results.map(item => {
        let materials = [];
        if (item.materials) {
          try {
            materials = typeof item.materials === 'string' 
              ? JSON.parse(item.materials) 
              : item.materials;
            if (!Array.isArray(materials)) {
              materials = [];
            }
          } catch (e) {
            console.error("解析 materials JSON 失败:", e);
            materials = [];
          }
        }
        return {
          ...item,
          materials: materials
        };
      });
    };

    db.query(allDataSql, params, (err, allResults) => {
      if (err) return res.cc(err);
      
      db.query(paginatedSql, paginatedParams, (err, paginatedResults) => {
        if (err) return res.cc(err);
        
        const allParsedResults = parseMaterials(allResults);
        const paginatedParsedResults = parseMaterials(paginatedResults);
        
        res.send({
          code: 0,
          message: "获取客户进度列表成功！",
          re: {
            list: paginatedParsedResults,
            allList: allParsedResults,
            total: total,
            currentPage: +currentPage,
            pageSize: +pageSize
          }
        });
      });
    });
  });
};

exports.create = (req, res) => {
  const {
    progress,
    technician,
    quantity,
    image,
    technician_audio,
    technician_video,
    chairside_audio,
    chairside_video,
    start_chairside_time,
    complete_chairside_time,
    chairside_doctor,
    daily_wear_status
  } = req.body;

  if (!progress) {
    return res.cc("客户名称和进度不能为空！");
  }

  const sql = `INSERT INTO customer_process ( progress, technician, quantity, image, technician_audio, technician_video, chairside_audio, chairside_video, start_chairside_time, complete_chairside_time, chairside_doctor, daily_wear_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [
    'not_started',
    technician || null,
    quantity || null,
    image || null,
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
    progress
  } = req.body;

  if (!id) return res.cc("缺少客户进度ID！");
  if ( !progress) {
    return res.cc("客户名称和进度不能为空！");
  }

  const sql = `UPDATE customer_process SET progress=? WHERE id=?`;

  db.query(sql, [
    progress,
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

exports.batchDelete = (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.cc("缺少客户进度ID列表！");
  }

  const placeholders = ids.map(() => '?').join(',');
  const sql = `DELETE FROM customer_process WHERE id IN (${placeholders})`;
  
  db.query(sql, ids, (err, results) => {
    if (err) return res.cc(err);
    if (results.affectedRows === 0) return res.cc("删除客户进度失败！");

    res.send({
      code: 0,
      message: `成功删除 ${results.affectedRows} 条记录！`,
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
      c.materials,
      c.qr_code,
      c.remark,
      c.type,
      cp.id as process_id,
      cp.progress,
      cp.technician,
      cp.image,
      cp.web_video,
      cp.technician_video,
      cp.factory_image,
      cp.factory_technician_video,
      cp.factory_web_video,
      cp.created_at as process_created_at,
      cp.updated_at as process_updated_at,
      cp.mini_image,
      cp.factory_mini_image,
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

    // 解析 materials JSON 字段
    let materials = [];
    if (results[0].materials) {
      try {
        materials = typeof results[0].materials === 'string' 
          ? JSON.parse(results[0].materials) 
          : results[0].materials;
        if (!Array.isArray(materials)) {
          materials = [];
        }
      } catch (e) {
        console.error("解析 materials JSON 失败:", e);
        materials = [];
      }
    }

    const result = {
      ...results[0],
      materials: materials
    };

    res.send({
      code: 0,
      message: "获取成功！",
      re: result
    });
  });
};

exports.updateTechnicianVideo = (req, res) => {
  const { customer_id, technician_video } = req.body;
  
  if (!customer_id) return res.cc("缺少客户ID！");
  if (technician_video === undefined || technician_video === null) return res.cc("缺少视频URL！");
  
  const checkSql = `SELECT id FROM customer_process WHERE customer_id=? LIMIT 1`;
  
  db.query(checkSql, [customer_id], (err, results) => {
    if (err) return res.cc(err);
    
    if (results.length > 0) {
      const updateSql = `UPDATE customer_process SET technician_video=? WHERE customer_id=?`;
      db.query(updateSql, [technician_video, customer_id], (err, updateResults) => {
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
        const insertSql = `INSERT INTO customer_process (customer_id, progress, technician_video) VALUES (?, ?, ?)`;
        db.query(insertSql, [customer_id, 'not_started', technician_video], (err, insertResults) => {
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

exports.updateWebVideo = (req, res) => {
  const { customer_id, web_video } = req.body;
  
  if (!customer_id) return res.cc("缺少客户ID！");
  if (web_video === undefined || web_video === null) return res.cc("缺少视频URL！");
  
  const checkSql = `SELECT id FROM customer_process WHERE customer_id=? LIMIT 1`;
  
  db.query(checkSql, [customer_id], (err, results) => {
    if (err) return res.cc(err);
    
    if (results.length > 0) {
      const updateSql = `UPDATE customer_process SET web_video=? WHERE customer_id=?`;
      db.query(updateSql, [web_video, customer_id], (err, updateResults) => {
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
        const insertSql = `INSERT INTO customer_process (customer_id, progress, web_video) VALUES (?, ?, ?)`;
        db.query(insertSql, [customer_id, 'not_started', web_video], (err, insertResults) => {
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

exports.updateImage = (req, res) => {
  const { customer_id, image } = req.body;
  if (!customer_id) return res.cc("缺少客户ID！");
  if (image === undefined || image === null) return res.cc("缺少图片URL！");
  
  const checkSql = `SELECT id FROM customer_process WHERE customer_id=? LIMIT 1`;
  db.query(checkSql, [customer_id], (err, results) => {
    if (err) return res.cc(err);
  if (results.length > 0) {
    const updateSql = `UPDATE customer_process SET image=? WHERE customer_id=?`;
    db.query(updateSql, [image, customer_id], (err, updateResults) => {
      if (err) return res.cc(err);
      res.send({
        code: 0,
        message: "更新图片成功！",
        re: null
      });
    });
  }
  else {
    const insertSql = `INSERT INTO customer_process (customer_id, image) VALUES (?, ?)`;
    db.query(insertSql, [customer_id, image], (err, insertResults) => {
      if (err) return res.cc(err);
      res.send({
        code: 0,
        message: "保存图片成功！",
        re: null
      });
    });
  }
  });
};

exports.updateFactoryTechnicianVideo = (req, res) => {
  const { customer_id, factory_technician_video } = req.body;
  
  if (!customer_id) return res.cc("缺少客户ID！");
  if (factory_technician_video === undefined || factory_technician_video === null) return res.cc("缺少视频URL！");
  
  const checkSql = `SELECT id FROM customer_process WHERE customer_id=? LIMIT 1`;
  
  db.query(checkSql, [customer_id], (err, results) => {
    if (err) return res.cc(err);
    
    if (results.length > 0) {
      const updateSql = `UPDATE customer_process SET factory_technician_video=? WHERE customer_id=?`;
      db.query(updateSql, [factory_technician_video, customer_id], (err, updateResults) => {
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
        
        const insertSql = `INSERT INTO customer_process (customer_id, progress, factory_technician_video) VALUES (?, ?, ?)`;
        db.query(insertSql, [customer_id, 'not_started', factory_technician_video], (err, insertResults) => {
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

exports.updateFactoryWebVideo = (req, res) => {
  const { customer_id, factory_web_video } = req.body;
  
  if (!customer_id) return res.cc("缺少客户ID！");
  if (factory_web_video === undefined || factory_web_video === null) return res.cc("缺少视频URL！");
  
  const checkSql = `SELECT id FROM customer_process WHERE customer_id=? LIMIT 1`;
  
  db.query(checkSql, [customer_id], (err, results) => {
    if (err) return res.cc(err);
    
    if (results.length > 0) {
      const updateSql = `UPDATE customer_process SET factory_web_video=? WHERE customer_id=?`;
      db.query(updateSql, [factory_web_video, customer_id], (err, updateResults) => {
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
        
        const insertSql = `INSERT INTO customer_process (customer_id, progress, factory_web_video) VALUES (?, ?, ?)`;
        db.query(insertSql, [customer_id, 'not_started', factory_web_video], (err, insertResults) => {
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

exports.updateFactoryImage = (req, res) => {
  const { customer_id, factory_image } = req.body;
  if (!customer_id) return res.cc("缺少客户ID！");
  if (factory_image === undefined || factory_image === null) return res.cc("缺少图片URL！");
  
  const checkSql = `SELECT id FROM customer_process WHERE customer_id=? LIMIT 1`;
  db.query(checkSql, [customer_id], (err, results) => {
    if (err) return res.cc(err);
    if (results.length > 0) {
      const updateSql = `UPDATE customer_process SET factory_image=? WHERE customer_id=?`;
      db.query(updateSql, [factory_image, customer_id], (err, updateResults) => {
        if (err) return res.cc(err);
        res.send({
          code: 0,
          message: "更新图片成功！",
          re: null
        });
      });
    } else {
      const insertSql = `INSERT INTO customer_process (customer_id, factory_image) VALUES (?, ?)`;
      db.query(insertSql, [customer_id, factory_image], (err, insertResults) => {
        if (err) return res.cc(err);
        res.send({
          code: 0,
          message: "保存图片成功！",
          re: null
        });
      });
    }
  });
};

exports.updateMiniImage = (req, res) => {
  const { customer_id, mini_image, factory_mini_image } = req.body;
  if (!customer_id) return res.cc("缺少客户ID！");
  
  let fieldName, imageValue;
  if (mini_image !== undefined && mini_image !== null) {
    fieldName = 'mini_image';
    imageValue = mini_image;
  } else if (factory_mini_image !== undefined && factory_mini_image !== null) {
    fieldName = 'factory_mini_image';
    imageValue = factory_mini_image;
  } else {
    return res.cc("缺少图片URL！");
  }
  
  const checkSql = `SELECT id FROM customer_process WHERE customer_id=? LIMIT 1`;
  db.query(checkSql, [customer_id], (err, results) => {
    if (err) return res.cc(err);
    if (results.length > 0) {
      const updateSql = `UPDATE customer_process SET ${fieldName}=? WHERE customer_id=?`;
      db.query(updateSql, [imageValue, customer_id], (err, updateResults) => {
        if (err) return res.cc(err);
        res.send({
          code: 0,
          message: "更新图片成功！",
          re: null
        });
      });
    } else {
      const insertSql = `INSERT INTO customer_process (customer_id, ${fieldName}) VALUES (?, ?)`;
      db.query(insertSql, [customer_id, imageValue], (err, insertResults) => {
        if (err) return res.cc(err);
        res.send({
          code: 0,
          message: "保存图片成功！",
          re: null
        });
      });
    }
  });
};
