const express = require('express');
const router = express.Router();
const aiScheduleHandler = require('../router_handler/ai-schedule');

router.post('/chat', aiScheduleHandler.chat);
router.get('/history/:session_id', aiScheduleHandler.history);
router.delete('/session/:session_id', aiScheduleHandler.deleteSession);
router.post('/confirm', aiScheduleHandler.confirm);
router.post('/vip-insert', aiScheduleHandler.vipInsert);

module.exports = router;
