const GREETING_PATTERNS = [
  /^(你好|您好|hi|hello|早上好|下午好|晚上好|嗨|hey|早|晚安)/i,
];

const THANKS_PATTERNS = [
  /^(谢谢|感谢|多谢|thanks|thank you|thx)/i,
];

const CONFIRM_PATTERNS = [
  /^(好的|明白|知道了|收到|ok|okay|嗯|好|行)/i,
];

const GREETING_RESPONSES = {
  greeting: "你好！我是排班助手，有什么可以帮您的吗？",
  thanks: "不客气！还有其他需要帮助的吗？",
  confirm: "好的，有需要随时告诉我。"
};

function matchSimpleIntent(message) {
  if (!message || typeof message !== 'string') {
    return { matched: false };
  }
  
  const trimmedMessage = message.trim();
  
  if (trimmedMessage.length > 20) {
    return { matched: false };
  }
  
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(trimmedMessage)) {
      return { matched: true, response: GREETING_RESPONSES.greeting, intent: 'greeting' };
    }
  }
  
  for (const pattern of THANKS_PATTERNS) {
    if (pattern.test(trimmedMessage)) {
      return { matched: true, response: GREETING_RESPONSES.thanks, intent: 'thanks' };
    }
  }
  
  for (const pattern of CONFIRM_PATTERNS) {
    if (pattern.test(trimmedMessage)) {
      return { matched: true, response: GREETING_RESPONSES.confirm, intent: 'confirm' };
    }
  }
  
  return { matched: false };
}

module.exports = {
  matchSimpleIntent
};
