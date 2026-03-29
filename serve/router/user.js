
const express = require('express')
const router = express.Router()
// 导入并使用首页处理函数
const user_handler = require('../router_handler/user')


// // 2. 导入需要的验证规则对象
// const { reg_login_schema } = require('../schema/index')

router.post('/login',user_handler.login)
router.post('/list',user_handler.list)
router.post('/create',user_handler.create)
router.post('/delete',user_handler.delete)
// router.post('/getmiyao',user_handler.getMiyao)
// router.post('/jiemi',user_handler.jiemi)
// router.post('/getQrImg',user_handler.getAccessToken)




// router.post('/log',user_handler.log)



module.exports = router