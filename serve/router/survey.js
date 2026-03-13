const express = require('express')
const router = express.Router()
const survey_handler = require('../router_handler/survey')

router.post('/submit', survey_handler.submit)
router.post('/list', survey_handler.list)
router.post('/delete', survey_handler.delete)
router.post('/delete', survey_handler.delete)

module.exports = router
