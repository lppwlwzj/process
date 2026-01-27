require('dotenv').config();
const axios = require('axios');
const config = require('./ai-schedule/config');

async function testOpenAI() {
  console.log('测试 OpenAI API Key...');
  console.log('API Key:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : '未设置');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY 未设置');
    return false;
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ OpenAI API Key 有效');
    console.log('响应:', response.data.choices[0].message.content);
    return true;
  } catch (error) {
    if (error.response) {
      console.error('❌ OpenAI API Key 无效或错误');
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ OpenAI API 请求超时');
    } else {
      console.error('❌ OpenAI API 错误:', error.message);
    }
    return false;
  }
}

async function testDeepSeek() {
  console.log('\n测试 DeepSeek API Key...');
  console.log('API Key:', process.env.DEEPSEEK_API_KEY ? `${process.env.DEEPSEEK_API_KEY.substring(0, 10)}...` : '未设置');
  
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY 未设置');
    return false;
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ DeepSeek API Key 有效');
    console.log('响应:', response.data.choices[0].message.content);
    return true;
  } catch (error) {
    if (error.response) {
      console.error('❌ DeepSeek API Key 无效或错误');
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ DeepSeek API 请求超时');
    } else {
      console.error('❌ DeepSeek API 错误:', error.message);
    }
    return false;
  }
}

async function main() {
  console.log('=== API Key 验证测试 ===\n');
  console.log('当前配置的模型类型:', config.aiModel.type || 'openai');
  console.log('');

  const modelType = config.aiModel.type || 'openai';
  
  if (modelType === 'deepseek') {
    const deepseekValid = await testDeepSeek();
    if (!deepseekValid) {
      console.log('\n⚠️  DeepSeek API Key 无效，尝试测试 OpenAI...');
      await testOpenAI();
    }
  } else {
    const openaiValid = await testOpenAI();
    if (!openaiValid) {
      console.log('\n⚠️  OpenAI API Key 无效，尝试测试 DeepSeek...');
      await testDeepSeek();
    }
  }

  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
