const express = require('express')
const router = express.Router()
const customer_handler = require('../router_handler/customer')

router.post('/list', customer_handler.list)
router.post('/create', customer_handler.create)
router.post('/update', customer_handler.update)
router.post('/updateWearTime', customer_handler.updateWearTime)
router.post('/delete', customer_handler.delete)
router.post('/batchDelete', customer_handler.batchDelete)
router.post('/detail', customer_handler.detail)
router.post('/generateSurveyQrCode', customer_handler.generateSurveyQrCode)
router.post('/getQrImg', customer_handler.generateQrCode)


module.exports = router
