const { ChatOpenAI } = require('@langchain/openai');
const DeepSeekChatModel = require('./deepseek-adapter');
const config = require('../config');

function createLLM() {
  const modelType = config.aiModel.type || 'openai';

  if (modelType === 'deepseek') {
    return new DeepSeekChatModel(config.aiModel.deepseek);
  } else {
    return new ChatOpenAI({
      openAIApiKey: config.aiModel.openai.apiKey,
      modelName: config.aiModel.openai.model,
      temperature: config.aiModel.openai.temperature,
      maxTokens: config.aiModel.openai.maxTokens,
      timeout: 60000,
      maxRetries: 2
    });
  }
}

module.exports = {
  createLLM
};
