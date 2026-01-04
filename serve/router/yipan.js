const express = require('express')
const router = express.Router()

const yipan_handler = require('../router_handler/yipan')

router.post('/add', yipan_handler.add)
router.post('/detail', yipan_handler.detail)
router.post('/update', yipan_handler.update)
router.post('/list', yipan_handler.list)
router.post('/start', yipan_handler.startChairside)
router.post('/complete', yipan_handler.completeChairside)
router.post('/history', yipan_handler.getHistory)
router.post('/updateChairsideVideo', yipan_handler.updateChairsideVideo)

module.exports = router
