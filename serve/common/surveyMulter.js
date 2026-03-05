const multer = require('multer')

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowed = ['audio/wav', 'audio/wave', 'audio/webm', 'audio/mpeg', 'audio/mp3']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的音频格式'), false)
  }
}

const surveyAudioUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
})

module.exports = surveyAudioUpload
