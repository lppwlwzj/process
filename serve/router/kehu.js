/**
create: James
time: 2022.8.21
to:商品
 */

const express = require('express')
const router = express.Router()

// 导入使用商品处理模块
const kehu_handler = require('../router_handler/kehu')

router.post('/add',kehu_handler.addKehu)
router.post('/edit',kehu_handler.editKehu)
router.post('/detail',kehu_handler.getKehuDetailById)
router.post('/list',kehu_handler.getKehuList)
router.post('/delete',kehu_handler.deleteKehu)



module.exports = router