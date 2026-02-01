const { parseTimeExpression, parseDateExpression } = require('./time-parser');
const dayjs = require('dayjs');

const projectTypes = ['面诊', '备牙', '戴牙', '椅旁', '复诊', '雕蜡', '蜡形试戴'];

function extractScheduleInfo(text) {
  const info = {
    date: null,
    doctor_name: null,
    nurse_name: null,
    customer_name: null,
    project: null,
    start_time: null,
    duration: null,
    buffer_time: null,
    room: null,
    remark: null,
    is_vip_priority: false
  };

  if (!text) return info;

  const normalizedText = text.trim();

  info.is_vip_priority = /(客户|.*?)(插队|优先)/.test(normalizedText);

  const vipMatch = normalizedText.match(/(.*?)(客户|.*?)(插队|优先)/);
  if (vipMatch) {
    info.customer_name = vipMatch[1].trim();
  }

  for (const projectType of projectTypes) {
    if (normalizedText.includes(projectType)) {
      info.project = projectType;
      break;
    }
  }

  const doctorMatch = normalizedText.match(/(.*?)(医生|总)/);
  if (doctorMatch) {
    info.doctor_name = doctorMatch[1].trim();
  }

  const nurseMatch = normalizedText.match(/(.*?)(护士)/);
  if (nurseMatch) {
    info.nurse_name = nurseMatch[1].trim();
  }

  const customerMatch = normalizedText.match(/客户\s*([^\s，,。]+)|给\s*([^\s，,。]+)\s*(安排|面诊|备牙|戴牙|复诊|雕蜡|蜡形试戴|休息)/);
  if (customerMatch) {
    info.customer_name = (customerMatch[1] || customerMatch[2]).trim();
  }

  const timeResult = parseTimeExpression(normalizedText);
  if (timeResult) {
    info.start_time = dayjs(timeResult).format('YYYY-MM-DD HH:mm:ss');
    info.date = dayjs(timeResult).format('YYYY-MM-DD');
  } else {
    const dateResult = parseDateExpression(normalizedText);
    if (dateResult) {
      info.date = dateResult;
    }
  }

  const durationMatch = normalizedText.match(/(\d+)\s*分钟/);
  if (durationMatch) {
    info.duration = parseInt(durationMatch[1]);
  }

  const bufferMatch = normalizedText.match(/(延后|可能延后|缓冲)\s*(\d+)\s*分钟/);
  if (bufferMatch) {
    info.buffer_time = parseInt(bufferMatch[2]);
  }

  const roomMatch = normalizedText.match(/诊室\s*([1-4])/);
  if (roomMatch) {
    info.room = `诊室${roomMatch[1]}`;
  }

  const remarkMatch = normalizedText.match(/备注[：:]\s*([^，,。]+)|，\s*([^，,。]+)$/);
  if (remarkMatch) {
    info.remark = (remarkMatch[1] || remarkMatch[2]).trim();
  }

  return info;
}

module.exports = {
  extractScheduleInfo
};
