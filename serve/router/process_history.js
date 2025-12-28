const express = require('express')
const router = express.Router()
const process_history_handler = require('../router_handler/process_history')

router.post('/add', process_history_handler.addHistory)
router.post('/list', process_history_handler.getHistory)

module.exports = router
