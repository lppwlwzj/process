const express = require('express')
const router = express.Router()
const customer_handler = require('../router_handler/customer')

router.post('/list', customer_handler.list)
router.post('/create', customer_handler.create)
router.post('/update', customer_handler.update)
router.post('/delete', customer_handler.delete)
router.post('/batchDelete', customer_handler.batchDelete)
router.post('/detail', customer_handler.detail)

module.exports = router
