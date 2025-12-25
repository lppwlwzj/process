// 导入数据库操作模块
const db = require("../db/index");

exports.customer = (req, res) => {
    const {
        startDate,
        endDate
    } = req.body;
    let sql = "";
    sql = `SELECT i.*,s.*
           FROM customer i 
           JOIN service s ON i.id = s.customer_id 
           WHERE i.createtime >= '${startDate} 00:00:00' 
           AND i.createtime <= '${endDate} 23:59:59'`;
           db.query(sql, (err, results) => {
            if (err) {
              return res.cc(err);
            }
            res.send({
              code: 0,
              message: "操作成功！",
              re: results
            })
        })
}


