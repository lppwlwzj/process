const express = require('express')
const router = express.Router()
const schedule_handler = require('../router_handler/schedule')

router.post('/list', schedule_handler.list)
router.post('/create', schedule_handler.create)
router.post('/update', schedule_handler.update)
router.post('/delete', schedule_handler.delete)
router.post('/detail', schedule_handler.detail)
router.post('/getLastPreparationDoctor', schedule_handler.getLastPreparationDoctor)

module.exports = router
