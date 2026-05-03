const db = require("../db/index");

exports.login = (req, res) => {
  const userinfo = req.body;
  if (!userinfo.phone || !userinfo.username) {
    return res.cc("请填写手机号和用户名！");
  }

  const { username, phone, remark } = userinfo;
  const selectSql = `SELECT * FROM ysd_phone WHERE phone = ?`;

  db.query(selectSql, [phone], (err, results) => {
    if (err) return res.cc(err);

    if (results && results.length > 0) {
      return res.send({
        code: 0,
        message: "成功",
        re: results[0]
      });
    }

    const insertSql = `INSERT INTO ysd_phone (username, phone, remark, contact_status) VALUES (?, ?, ?, 0)`;
    const remarkVal = remark === undefined || remark === null || remark === "" ? null : remark;

    db.query(insertSql, [username, phone, remarkVal], (err2, insertResults) => {
      if (err2) return res.cc(err2);
      res.send({
        code: 0,
        message: "成功",
        re: {
          id: insertResults.insertId,
          username,
          phone,
          remark: remarkVal
        }
      });
    });
  });
};
exports.remark = (req, res) => {
  const { phone, remark } = req.body;
  const updateSql = `UPDATE ysd_phone SET remark = ? WHERE phone = ?`;
  db.query(updateSql, [remark, phone], (err, results) => {
    if (err) return res.cc(err);
    res.send({
      code: 0,
      message: "成功",
      re: results
    });
  });
};

exports.phoneList = (req, res) => {
  const {
    start_date,
    end_date,
    phone,
    contact_status,
    currentPage = 1,
    pageSize = 20
  } = req.body;

  const conditions = [];
  const params = [];

  if (start_date && end_date) {
    conditions.push("DATE(created_at) >= ? AND DATE(created_at) <= ?");
    params.push(start_date, end_date);
  }
  if (phone) {
    conditions.push("phone LIKE ?");
    params.push(`%${phone}%`);
  }
  if (contact_status !== undefined && contact_status !== null && contact_status !== "") {
    const cs = Number(contact_status);
    if (cs === 0 || cs === 1) {
      conditions.push("contact_status = ?");
      params.push(cs);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countSql = `SELECT COUNT(DISTINCT phone) AS total FROM ysd_phone ${where}`;

  const page = Math.max(1, parseInt(currentPage, 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (page - 1) * size;

  db.query(countSql, params, (err, countRows) => {
    if (err) return res.cc(err);
    const total = countRows[0]?.total ?? 0;

    const listSql = `SELECT p.id, p.username, p.phone, p.remark, p.contact_status, p.created_at, p.updated_at
FROM ysd_phone p
INNER JOIN (
  SELECT phone, MAX(id) AS max_id
  FROM ysd_phone
  ${where}
  GROUP BY phone
) t ON p.phone = t.phone AND p.id = t.max_id
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?`;
    db.query(listSql, [...params, size, offset], (err2, list) => {
      if (err2) return res.cc(err2);
      res.send({
        code: 0,
        message: "成功",
        re: { list: list || [], total }
      });
    });
  });
};

exports.phoneUpdate = (req, res) => {
  const { id, username, phone, remark, contact_status } = req.body;
  if (!id) return res.cc("缺少记录ID");
  if (!username || !phone) return res.cc("用户名和手机号不能为空");

  const fields = [];
  const values = [];
  fields.push("username = ?");
  values.push(username);
  fields.push("phone = ?");
  values.push(phone);
  fields.push("remark = ?");
  values.push(remark === undefined || remark === "" ? null : remark);

  if (contact_status !== undefined && contact_status !== null && contact_status !== "") {
    const cs = Number(contact_status);
    if (cs === 0 || cs === 1) {
      fields.push("contact_status = ?");
      values.push(cs);
    }
  }

  values.push(id);
  const updateSql = `UPDATE ysd_phone SET ${fields.join(", ")} WHERE id = ?`;

  db.query(updateSql, values, (err, results) => {
    if (err) return res.cc(err);
    if (results.affectedRows === 0) return res.cc("记录不存在或未修改");
    res.send({ code: 0, message: "更新成功", re: null });
  });
};

exports.phoneDelete = (req, res) => {
  const { id } = req.body;
  if (!id) return res.cc("缺少记录ID");

  db.query("DELETE FROM ysd_phone WHERE id = ?", [id], (err, results) => {
    if (err) return res.cc(err);
    if (results.affectedRows === 0) return res.cc("记录不存在");
    res.send({ code: 0, message: "删除成功", re: null });
  });
};