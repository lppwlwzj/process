/**
create: James
time: 2022.8.21
to:商品
 */
const moment = require("moment");
// 导入数据库操作模块
const db = require("../db/index");

exports.addKehu = (req, res) => {
  const { kehu, dateTime, doctor, proxy, reason, content,imgList } = req.body;
  const createtime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const sql = `insert into kehu (
		    kehu,
        dateTime,
        doctor,
        proxy,
       reason,
        content,
        imgList
	) values ('${kehu}','${dateTime}','${doctor}','${proxy}','${reason}','${content}','${imgList}')`;
  // 更新参数表

  db.query(sql, (err, results) => {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("新增失败！");
    console.log("results", results);
    res.send({
      code: 0,
      message: "新增成功！",
      re: {
        id: results.insertId
      }
    });
    // setTimeout(() => {
    //   const _sql = `select id  from kehu  where customer_id = '${customer_id}'`;
    //   db.query(_sql, (err, result) => {
    //     console.log('req.app.get("token")', req.app.get("token"));
    //     req.app.logger(
    //       req.headers.authorization.replace(/Bearer\s/g, ""),
    //       `添加${kehu}客户`
    //     );
    //     res.send({
    //       code: 0,
    //       message: "新增信息成功！",
    //       re: {
    //         id: result[0].id
    //       }
    //     });
    //   });
    // }, 100);
  });
};

exports.editKehu = (req, res) => {
  const { id, kehu, dateTime, doctor, proxy, reason, content, imgList } = req.body;
  const sql = `update  kehu set
  kehu='${kehu}',
			dateTime='${dateTime}',
			doctor='${doctor}',
			proxy='${proxy}',
			reason='${reason}',
			content='${content}',
			imgList='${imgList}'
			 where id=${id}`;
  // 更新参数表
  db.query(sql, (err, results) => {
    if (err) return res.cc(err);
    res.send({
      code: 0,
      message: "修改成功！",
      re: {
        id
      }
    });
  });
};

exports.getKehuDetailById = (req, res) => {
  const { id } = req.body;
  const sql = `select * from  kehu where id=${id}`;
  // 更新参数表
  db.query(sql, (err, results) => {
    if (err) return res.cc(err);
    res.send({
      code: 0,
      message: "查询成功！",
      data: {
        ...results[0]
      }
    });
  });
};
exports.deleteKehu = (req, res) => {
  const { id } = req.body;
  const sql = `delete  from  kehu where id=${id}`;
  // 更新参数表
  db.query(sql, (err, results) => {
    if (err) return res.cc(err);

    res.send({
      code: 0,
      message: "删除成功！",
      re: {}
    });
  });
};
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

/**
 * 根据数组对象的某个字段去重
 * item.name  是[{name:1}] 根据每条数据的name值来去重
 * */
const unique = (arr, val) => {
  const res = new Map();
  return arr.filter((item) => !res.has(item[val]) && res.set(item[val], 1));
};

exports.getKehuList = (req, res) => {
  const { search } = req.body;
  let sql = "";
  if ((isNaN(search) && !isNaN(Date.parse(search))) || search.includes('###')) {
    const between = search.includes('###')
    const [start, end] = search.split('###');
    sql = between ? ` select i.*  from kehu i where i.dateTime between '${start}' and '${end}'` : ` select i.*  from kehu i where i.dateTime = '${search}'`;
    db.query(sql, req.body, async (err, results) => {
      if (err) return res.cc(err);
      res.send({
        code: 0,
        message: "查询成功！",
        re: results
      });
    });
  } else {
    const sql1 = ` select i.*   from kehu i  where i.kehu LIKE "%${search}%"`;
    const sql2 = ` select i.*   from kehu i where i.reason LIKE "%${search}%"`;
    const sql3 = ` select i.*   from kehu i where i.doctor LIKE "%${search}%"`;
    const sql4 = ` select i.*   from kehu i where i.proxy LIKE "%${search}%"`;

    const p1 = new Promise((resolve, reject) => {
      db.query(sql1, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    const p2 = new Promise((resolve, reject) => {
      db.query(sql2, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    const p3 = new Promise((resolve, reject) => {
      db.query(sql3, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    const p4 = new Promise((resolve, reject) => {
      db.query(sql4, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
    Promise.all([p1, p2, p3, p4])
      .then(async (results) => {
        const _list = results[0]
          .concat(results[1])
          .concat(results[2])
          .concat(results[3]);
        const list = unique(_list, "id");
        res.send({
          code: 0,
          message: "查询成功！",
          re: list
        });
      })
      .catch((err) => res.cc(err));
  }
};
