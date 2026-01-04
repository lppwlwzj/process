const express = require('express')
const router = express.Router()
const process_handler = require('../router_handler/process')

router.post('/list', process_handler.list)
router.post('/create', process_handler.create)
router.post('/update', process_handler.update)
router.post('/delete', process_handler.delete)
router.post('/detail', process_handler.detail)
router.post('/updateTechnicianVideo', process_handler.updateTechnicianVideo)

module.exports = router

