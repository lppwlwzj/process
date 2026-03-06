const express = require('express')
const router = express.Router()
const survey_handler = require('../router_handler/survey')

router.post('/submit', survey_handler.submit)
router.post('/list', survey_handler.list)

module.exports = router
