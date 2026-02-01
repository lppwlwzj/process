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

  const doctorPatterns = [
    /[，,、]([^\s，,、。]+?)(医生|总)[，,。]?/,
    /([一-龥]{1,4})(医生|总)[，,。]?/,
  ];
  for (const pattern of doctorPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length <= 4 && !/[帮给约安排]/.test(name)) {
        info.doctor_name = name;
        break;
      }
    }
  }

  const nursePatterns = [
    /[，,、]([^\s，,、。]+?)(护士)[，,。]?/,
    /([一-龥]{1,4})(护士)[，,。]?/,
  ];
  for (const pattern of nursePatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length <= 4 && !/[帮给约安排]/.test(name)) {
        info.nurse_name = name;
        break;
      }
    }
  }

  const customerPatterns = [
    /[帮给为]([一-龥]{2,4})客户/,
    /客户([一-龥]{2,4})/,
    /[帮给为]([一-龥]{2,4})[约安排]+(面诊|备牙|戴牙|椅旁|复诊|雕蜡|蜡形试戴|休息)/,
    /给([一-龥]{2,4})\s*(安排|约)/,
  ];
  for (const pattern of customerPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      info.customer_name = match[1].trim();
      break;
    }
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

  const remarkMatch = normalizedText.match(/备注[：:]\s*([^，,。]+)/);
  if (remarkMatch) {
    info.remark = remarkMatch[1].trim();
  }

  return info;
}

module.exports = {
  extractScheduleInfo
};
