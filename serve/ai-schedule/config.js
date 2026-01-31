const config = {
  aiModel: {
    type: process.env.AI_MODEL_TYPE || 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0,
      maxTokens: 2000
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      temperature: 0,
      maxTokens: 2000,
      baseURL: 'https://api.deepseek.com/v1'
    }
  },
  memory: {
    retentionDays: 30,
    maxMessagesPerSession: 20
  },
  schedule: {
    projectTypes: {
      noConflictCheck: ['面诊', '雕蜡', '椅旁'],
      withConflictCheck: ['备牙', '戴牙', '复诊', '蜡形试戴']
    },
    defaultDurations: {
      '面诊': 40,
      '备牙': 70,
      '戴牙': 90,
      '复诊': 30,
      '雕蜡': 60,
      '蜡形试戴': 45
    }
  },
  sse: {
    heartbeatInterval: 30000,
    connectionTimeout: 300000
  }
};

module.exports = config;
