const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

const timePatterns = {
  '今天': () => dayjs(),
  '明天': () => dayjs().add(1, 'day'),
  '后天': () => dayjs().add(2, 'day'),
  '大后天': () => dayjs().add(3, 'day'),
  '昨天': () => dayjs().subtract(1, 'day'),
  '前天': () => dayjs().subtract(2, 'day')
};

const timeOfDayPatterns = {
  '上午': (hour = 9) => hour < 12 ? hour : 9,
  '下午': (hour = 14) => hour >= 12 ? hour : (hour + 12),
  '晚上': (hour = 19) => hour >= 18 ? hour : (hour + 12),
  '中午': () => 12,
  '傍晚': () => 18
};

function parseTimeExpression(text, baseDate = dayjs()) {
  if (!text) return null;

  const normalizedText = text.trim();

  if (dayjs(normalizedText).isValid()) {
    return dayjs(normalizedText).toDate();
  }

  let date = baseDate;
  let hour = null;
  let minute = 0;

  for (const [pattern, fn] of Object.entries(timePatterns)) {
    if (normalizedText.includes(pattern)) {
      date = fn();
      break;
    }
  }

  const hourMatch = normalizedText.match(/(\d{1,2})[点时]/);
  if (hourMatch) {
    hour = parseInt(hourMatch[1]);
  }

  const minuteMatch = normalizedText.match(/(\d{1,2})分/);
  if (minuteMatch) {
    minute = parseInt(minuteMatch[1]);
  }

  for (const [pattern, fn] of Object.entries(timeOfDayPatterns)) {
    if (normalizedText.includes(pattern)) {
      hour = fn(hour);
      break;
    }
  }

  if (hour !== null) {
    return date.hour(hour).minute(minute).second(0).millisecond(0).toDate();
  }

  if (normalizedText.includes('现在') || normalizedText.includes('当前')) {
    return baseDate.toDate();
  }

  const relativeMatch = normalizedText.match(/(\d+)(分钟|小时|天)(后|前)/);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2] === '分钟' ? 'minute' : relativeMatch[2] === '小时' ? 'hour' : 'day';
    const direction = relativeMatch[3] === '后' ? 'add' : 'subtract';
    return date[direction](amount, unit).toDate();
  }

  return null;
}

function parseDateExpression(text, baseDate = dayjs()) {
  if (!text) return null;

  const normalizedText = text.trim();

  for (const [pattern, fn] of Object.entries(timePatterns)) {
    if (normalizedText.includes(pattern)) {
      return fn().format('YYYY-MM-DD');
    }
  }

  if (dayjs(normalizedText).isValid()) {
    return dayjs(normalizedText).format('YYYY-MM-DD');
  }

  return null;
}

module.exports = {
  parseTimeExpression,
  parseDateExpression
};
