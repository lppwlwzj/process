
const express = require('express')
const router = express.Router()
// 导入并使用首页处理函数
const download_handler = require('../router_handler/download')


router.post('/customer',download_handler.customer)


module.exports = router