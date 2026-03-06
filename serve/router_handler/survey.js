const db = require('../db/index')
const surveyAudioUpload = require('../common/surveyMulter')
const uploadFileToCOS = require('../common/cosUpload')

const ROLES = ['reception', 'consultant', 'photographer', 'doctor', 'nurse', 'waxDesigner']
exports.list = (req, res) => {
  const { customer_id, start_date, end_date, page = 1, pageSize = 20 } = req.body
  let sql = `SELECT sr.id, sr.customer_id, c.customer_name, sr.reception, sr.consultant, sr.photographer, sr.doctor, sr.nurse, sr.wax_designer, sr.audio_url, sr.created_at
    FROM survey_rating sr
    LEFT JOIN customer c ON sr.customer_id = c.id
    WHERE 1=1`
  const params = []

  if (customer_id && customer_id.trim()) {
    sql += ` AND sr.customer_id = ?`
    params.push(customer_id.trim())
  }
  if (start_date) {
    sql += ` AND DATE(sr.created_at) >= ?`
    params.push(start_date)
  }
  if (end_date) {
    sql += ` AND DATE(sr.created_at) <= ?`
    params.push(end_date)
  }

  sql += ` ORDER BY sr.created_at DESC`

  const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10)
  const limit = Math.min(parseInt(pageSize, 10) || 20, 100)
  sql += ` LIMIT ? OFFSET ?`
  params.push(limit, offset)

  db.query(sql, params, (err, results) => {
    if (err) return res.cc(err)
    let countSql = `SELECT COUNT(*) as total FROM survey_rating sr WHERE 1=1`
    const countParams = []
    if (customer_id && customer_id.trim()) { countSql += ` AND sr.customer_id = ?`; countParams.push(customer_id.trim()) }
    if (start_date) { countSql += ` AND DATE(sr.created_at) >= ?`; countParams.push(start_date) }
    if (end_date) { countSql += ` AND DATE(sr.created_at) <= ?`; countParams.push(end_date) }
    db.query(countSql, countParams, (countErr, countRes) => {
      if (countErr) return res.cc(countErr)
      res.send({
        code: 0,
        re: results,
        total: countRes[0]?.total || 0
      })
    })
  })
}
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
      res.send({ code: 0, message: '提交成功', audio_url: audioUrl || null })
    })
  }

  const audioFile = req.file
  if (audioFile && audioFile.buffer) {
    console.log('[survey] 收到录音文件 size=%d mimetype=%s', audioFile.buffer.length, audioFile.mimetype)
    const fileKey = `survey-audio/${row.customer_id}-${Date.now()}.wav`
    uploadFileToCOS(audioFile.buffer, fileKey, audioFile.mimetype || 'audio/wav')
      .then((location) => {
        const audioUrl = `https://${location}`
        console.log('[survey] 录音上传成功 url=%s', audioUrl)
        insertRow(audioUrl)
      })
      .catch((err) => {
        console.error('[survey] 录音上传失败', err)
        insertRow(null)
      })
  } else {
    if (!audioFile) {
      console.log('[survey] 未收到录音文件 req.file=%s', req.file ? 'exists' : 'undefined')
    } else {
      console.log('[survey] 录音文件无 buffer')
    }
    insertRow(null)
  }
}

exports.submit = [
  surveyAudioUpload.single('audio'),
  submitHandler
]
