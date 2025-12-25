/**
create: James
time: 2022.8.21
to:商品
 */
const moment = require("moment");
// 导入数据库操作模块
const db = require("../db/index");

exports.addCustomer = (req, res) => {
  const {
    adjust,
    toothSensitivity,
    problem,
    shangyouImg,
    shangciRemark,
    shangyou,
    shangyou5,
    shangyou5Remark,
    CADRemark,
    checiRemark,
    shangyouRemark,
    shangciImg,
    shangyou5Img,
    daodianImg,
    isPrivacy,
    customer_id,
    customer,
    dateTime,
    daiyaTime,
    fuzhenTime,
    doctor,
    proxy,
    tiepianColor,
    tiepianRemark,
    nurse,
    CADImg,
    checiImg,
    CAD,
    checi,
    shangci,
    porcelain,
    frontPhoto,
    adviceContent,
    leftFv,
    rightFv,
    front,
    leftFvEdge,
    rightFvEdge,
    intentImg,
    designAdvice,
    designList,
    bianyuanOpen,
    bianyuanValue,
    roundOpen,
    roundValue,
    luochaOpen,
    luochaValue,
    angleOpen,
    angleValue,
    jiandunOpen,
    jiandunValue,
    qieduanOpen,
    qieduanValue,
    textureOpen,
    textureValue,
    dotOpen,
    dotValue,
    touliangOpen,
    touliangValue,
    qieduanLinearsOpen,
    qieduanLinearsValue,
    thicknessOpen,
    thicknessValue
  } = req.body;
  const createtime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
  const _designList = JSON.stringify(designList);
  const sql = `insert into customer (
    adjust,
    toothSensitivity,
    problem,
    shangyouImg,
    shangciRemark,
    shangyou,
    shangyou5,
    shangyou5Remark,
    CADRemark,
    checiRemark,
    shangyouRemark,
    shangciImg,
    shangyou5Img,
    daodianImg,
    isPrivacy,
    createtime,
    customer_id,
		customer,
        dateTime,
        daiyaTime,
        fuzhenTime,
        doctor,
        proxy,
        tiepianColor,
        tiepianRemark,
        CADImg,
        checiImg,
        CAD,
        checi,
        shangci,
        porcelain,
        frontPhoto,
        adviceContent,
        leftFv,
        rightFv,
        front,
        leftFvEdge,
        rightFvEdge,
        intentImg,
        designAdvice,
        designList,
        bianyuanOpen,
        bianyuanValue,
        roundOpen,
        roundValue,
        luochaOpen,
        luochaValue,
        angleOpen,
        angleValue,
        jiandunOpen,
        jiandunValue,
        qieduanOpen,
        qieduanValue,
        textureOpen,
        textureValue,
        dotOpen,
        dotValue,
        touliangOpen,
        touliangValue,
        qieduanLinearsOpen,
        qieduanLinearsValue,
        thicknessOpen,
        thicknessValue,
        nurse
	) values ('${adjust}','${toothSensitivity}','${problem}','${shangyouImg}','${shangciRemark}','${shangyou}','${shangyou5}','${shangyou5Remark}','${CADRemark}','${checiRemark}','${shangyouRemark}','${shangciImg}','${shangyou5Img}','${daodianImg}','${isPrivacy}','${createtime}','${customer_id}','${customer}','${dateTime}','${daiyaTime}','${fuzhenTime}','${doctor}','${proxy}','${tiepianColor}','${tiepianRemark}','${CADImg}','${checiImg}','${CAD}','${checi}','${shangci}','${porcelain}','${frontPhoto}','${adviceContent}','${leftFv}','${rightFv}','${front}','${leftFvEdge}','${rightFvEdge}','${intentImg}','${designAdvice}','${_designList}','${bianyuanOpen}','${bianyuanValue}','${roundOpen}','${roundValue}','${luochaOpen}','${luochaValue}','${angleOpen}','${angleValue}','${jiandunOpen}','${jiandunValue}','${qieduanOpen}','${qieduanValue}','${textureOpen}','${textureValue}','${dotOpen}','${dotValue}','${touliangOpen}','${touliangValue}','${qieduanLinearsOpen}','${qieduanLinearsValue}','${thicknessOpen}','${thicknessValue}','${nurse}')`;
  // 更新参数表
  
  db.query(sql, (err, results) => {
    if (err) return res.cc(err);
    if (results.affectedRows !== 1) return res.cc("新增失败！");
    setTimeout(() => {
      const _sql = `select id  from customer  where customer_id = '${customer_id}'`;
      db.query(_sql, (err, result) => {
        console.log('req.app.get("token")', req.app.get("token"));
        req.app.logger(
          req.headers.authorization.replace(/Bearer\s/g, ""),
          `添加${customer}客户`
        );
        res.send({
          code: 0,
          message: "新增信息成功！",
          re: {
            id: result[0].id
          }
        });
      });
    }, 100);
  });
};

exports.editCustomer = (req, res) => {
  const {
    adjust,
    toothSensitivity,
    shangciRemark,
    shangyou,
    shangyou5,
    shangyou5Remark,
    CADRemark,
    checiRemark,
    shangyouRemark,
    problem,
    shangyouImg,
    shangciImg,
    shangyou5Img,
    daodianImg,
    id,
    isPrivacy,
    customer,
    dateTime,
    daiyaTime,
    fuzhenTime,
    doctor,
    proxy,
    tiepianColor,
    tiepianRemark,
    nurse,
    CADImg,
    checiImg,
    CAD,
    checi,
    shangci,
    porcelain,
    frontPhoto,
    adviceContent,
    leftFv,
    rightFv,
    front,
    leftFvEdge,
    rightFvEdge,
    intentImg,
    designAdvice,
    designList,
    bianyuanOpen,
    bianyuanValue,
    roundOpen,
    roundValue,
    luochaOpen,
    luochaValue,
    angleOpen,
    angleValue,
    jiandunOpen,
    jiandunValue,
    qieduanOpen,
    qieduanValue,
    textureOpen,
    textureValue,
    dotOpen,
    dotValue,
    touliangOpen,
    touliangValue,
    qieduanLinearsOpen,
    qieduanLinearsValue,
    thicknessOpen,
    thicknessValue
  } = req.body;
  const _designList = JSON.stringify(designList);
  const sql = `update  customer set
  nurse='${nurse}',
  adjust='${adjust}',
  toothSensitivity='${toothSensitivity}',
  shangciRemark='${shangciRemark}',
  shangyou='${shangyou}',
  shangyou5='${shangyou5}',
  shangyou5Remark='${shangyou5Remark}',
  CADRemark='${CADRemark}',
  checiRemark='${checiRemark}',
  shangyouRemark='${shangyouRemark}',
  problem='${problem}',
  shangyouImg='${shangyouImg}',
  shangciImg='${shangciImg}',
  shangyou5Img='${shangyou5Img}',
  daodianImg='${daodianImg}',
  isPrivacy='${isPrivacy}',
			customer='${customer}',
			dateTime='${dateTime}',
			daiyaTime='${daiyaTime}',
      fuzhenTime='${fuzhenTime}',
			doctor='${doctor}',
			proxy='${proxy}',
			tiepianColor='${tiepianColor}',
      tiepianRemark='${tiepianRemark}',
			CADImg='${CADImg}',
			checiImg='${checiImg}',
			CAD='${CAD}',
			checi='${checi}',
      shangci='${shangci}',
			porcelain='${porcelain}',
			frontPhoto='${frontPhoto}',
			adviceContent='${adviceContent}',
			leftFv='${leftFv}',
			rightFv='${rightFv}',
			front='${front}',
			leftFvEdge='${leftFvEdge}',
			rightFvEdge='${rightFvEdge}',
			intentImg='${intentImg}',
			designAdvice='${designAdvice}',
			designList='${_designList}',
			bianyuanOpen='${bianyuanOpen}',
			bianyuanValue='${bianyuanValue}',
			roundOpen='${roundOpen}',
			roundValue='${roundValue}',
			luochaOpen='${luochaOpen}',
			luochaValue='${luochaValue}',
			angleOpen='${angleOpen}',
			angleValue='${angleValue}',
			jiandunOpen='${jiandunOpen}',
			jiandunValue='${jiandunValue}',
			qieduanOpen='${qieduanOpen}',
			qieduanValue='${qieduanValue}',
			textureOpen='${textureOpen}',
			textureValue='${textureValue}',
			dotOpen='${dotOpen}',
			dotValue='${dotValue}',
			touliangOpen='${touliangOpen}',
			touliangValue='${touliangValue}',
			qieduanLinearsOpen='${qieduanLinearsOpen}',
			qieduanLinearsValue='${qieduanLinearsValue}',
			thicknessOpen='${thicknessOpen}',
			thicknessValue='${thicknessValue}' where id=${id}`;
  // 更新参数表
  db.query(sql, (err, results) => {
    if (err) return res.cc(err);
    // const
    req.app.logger(
      req.headers.authorization.replace(/Bearer\s/g, ""),
      `修改${customer}客户`
    );
    res.send({
      code: 0,
      message: "修改成功！",
      re: {
        id
      }
    });
  });
};

exports.getCustomerDetailById = (req, res) => {
  const { id } = req.body;
  const sql = `select * from  customer where id=${id}`;
  // 更新参数表
  db.query(sql, (err, results) => {
    if (err) return res.cc(err);
    if (results.length)
      db.query(
        `select s.id as service_id  from  customer i JOIN service s ON i.id = s.customer_id  where i.id=${id}`,
        (_err, _results) => {
          if (_err) return res.cc(_err);
          res.send({
            code: 0,
            message: "查询成功！",
            data: {
              service_id: _results[0]?.service_id || "",
              ...results[0]
            }
          });
        }
      );
  });
};
exports.deleteCustomer = (req, res) => {
  const { id } = req.body;
  const sql = `delete  from  customer where id=${id}`;
  // 更新参数表
  db.query(sql, (err, results) => {
    if (err) return res.cc(err);
    req.app.logger(
      req.headers.authorization.replace(/Bearer\s/g, ""),
      `删除客户`
    );

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

const getServiceInfo = (customer_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `select  tryInfo,recoverInfo ,id as service_id ,imgList from  service  where customer_id = ${customer_id}`,
      (err, results) => {
        if (err) return reject(err);
        if (!results.length) {
          resolve([]);
        } else {
          resolve(results[0]);
        }
      }
    );
  });
};


const getCustomerListByDate = async (req, res) => {
  const { search } = req.body;
  const between = search.includes('###')
  const [start, end] = search.split('###');
  const sql1 =between ? `select i.* from customer i where i.dateTime between '${start}' and '${end}'` : ` select i.*  from customer i where i.dateTime = '${search}'`;
  const sql2 = between ? `select i.* from customer i where i.daiyaTime between '${start}' and '${end}'` : ` select i.*  from customer i where i.daiyaTime =  '${search}'`;
  const sql3 =between ? `select i.* from customer i where i.fuzhenTime between '${start}' and '${end}'` : ` select i.*  from customer i where i.fuzhenTime = '${search}'`;


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

  Promise.all([p1, p2,p3])
    .then(async (results) => {

      const list1 = unique(results[0], "id");
      if (list1.length) {
        await asyncForEach(list1, async (item, index) => {
          var serviceInfo = await getServiceInfo(list1[index].id);
          list1[index] = serviceInfo
            ? {
                ...list1[index],
                ...serviceInfo
              }
            : list1[index];
        });
      }


      const list2 = unique(results[1], "id");
      if (list2.length) {
        await asyncForEach(list2, async (item, index) => {
          var serviceInfo = await getServiceInfo(list2[index].id);
          list2[index] = serviceInfo
            ? {
                ...list2[index],
                ...serviceInfo
              }
            : list2[index];
        });
      }


      const list3 = unique(results[2], "id");
      if (list3.length) {
        await asyncForEach(list3, async (item, index) => {
          var serviceInfo = await getServiceInfo(list3[index].id);
          list3[index] = serviceInfo
            ? {
                ...list3[index],
                ...serviceInfo
              }
            : list3[index];
        });
      }

      res.send({
        code: 0,
        message: "查询成功！",
        re:[
          {
            dateTime: list1 ?? [],
            daiyaTime: list2 ?? [],
            fuzhenTime: list3 ?? []
          }
        ]
      });
     
    })
    .catch((err) => res.cc(err));
}

exports.getCustomerList = (req, res) => {
  const { search } = req.body;
  let sql = "";
  if ((isNaN(search) && !isNaN(Date.parse(search))) || search.includes('###')) {

    getCustomerListByDate(req, res);
  } else {
    // const sql1 = ` select i.* , s.tryInfo,s.recoverInfo ,s.id as service_id  from customer i JOIN service s ON i.id = s.customer_id where i.customer LIKE "%${search}%"`;
    // const sql2 = ` select i.* , s.tryInfo,s.recoverInfo ,s.id as service_id  from customer i JOIN service s ON i.id = s.customer_id where i.porcelain LIKE "%${search}%"`;

    const sql1 = ` select i.*   from customer i  where i.customer LIKE "%${search}%"`;
    const sql2 = ` select i.*   from customer i where i.porcelain LIKE "%${search}%"`;
    const sql3 = ` select i.*   from customer i where i.doctor LIKE "%${search}%"`;
    const sql4 = ` select i.*   from customer i where i.proxy LIKE "%${search}%"`;

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
    Promise.all([p1, p2,p3,p4])
      .then(async (results) => {
        const _list = results[0].concat(results[1]).concat(results[2]).concat(results[3]);
        const list = unique(_list, "id");
        if (list.length) {
          await asyncForEach(list, async (item, index) => {
            var serviceInfo = await getServiceInfo(list[index].id);
            list[index] = serviceInfo
              ? {
                  ...list[index],
                  ...serviceInfo
                }
              : list[index];
          });
        }
        res.send({
          code: 0,
          message: "查询成功！",
          re: list
        });
      })
      .catch((err) => res.cc(err));
  }
};
