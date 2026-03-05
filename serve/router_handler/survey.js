const db = require('../db/index')
const surveyAudioUpload = require('../common/surveyMulter')
const uploadFileToCOS = require('../common/cosUpload')

const ROLES = ['reception', 'consultant', 'photographer', 'doctor', 'nurse', 'waxDesigner']
const MIN = -100
const MAX = 100

function isValidScore(n) {
  return typeof n === 'number' && !isNaN(n) && n >= MIN && n <= MAX && Number.isInteger(n)
}

function submitHandler(req, res) {
  let ratings = req.body.ratings
  if (typeof ratings === 'string') {
    try {
      ratings = JSON.parse(ratings)
    } catch (e) {
      return res.cc('评价数据格式错误', 1)
    }
  }

  const customer_id = req.body.customer_id

  if (!customer_id || typeof customer_id !== 'string' || !customer_id.trim()) {
    return res.cc('缺少客户ID', 1)
  }

  if (!ratings || typeof ratings !== 'object') {
    return res.cc('缺少评价数据', 1)
  }

  for (const key of ROLES) {
    if (!isValidScore(ratings[key])) {
      return res.cc(`评分无效: ${key}`, 1)
    }
  }

  const row = {
    customer_id: customer_id.trim(),
    reception: ratings.reception,
    consultant: ratings.consultant,
    photographer: ratings.photographer,
    doctor: ratings.doctor,
    nurse: ratings.nurse,
    wax_designer: ratings.waxDesigner,
    audio_url: null
  }

  const insertRow = (audioUrl) => {
    row.audio_url = audioUrl
    const sql = `INSERT INTO survey_rating (customer_id, reception, consultant, photographer, doctor, nurse, wax_designer, audio_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    const params = [
      row.customer_id,
      row.reception,
      row.consultant,
      row.photographer,
      row.doctor,
      row.nurse,
      row.wax_designer,
      row.audio_url
    ]
    db.query(sql, params, (err) => {
      if (err) return res.cc(err)
      res.send({ code: 0, message: '提交成功' })
    })
  }

  const audioFile = req.file
  if (audioFile && audioFile.buffer) {
    const fileKey = `survey-audio/${row.customer_id}-${Date.now()}.wav`
    uploadFileToCOS(audioFile.buffer, fileKey, audioFile.mimetype || 'audio/wav')
      .then((location) => {
        insertRow(`https://${location}`)
      })
      .catch((err) => {
        insertRow(null)
      })
  } else {
    insertRow(null)
  }
}

exports.submit = [
  surveyAudioUpload.single('audio'),
  submitHandler
]
