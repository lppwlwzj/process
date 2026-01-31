const { BaseChatModel } = require('@langchain/core/language_models/chat_models');
const { AIMessageChunk } = require('@langchain/core/messages');
const { ChatGenerationChunk } = require('@langchain/core/outputs');


const axios = require('axios');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');

class DeepSeekChatModel extends BaseChatModel {
  constructor(config) {
    super({});
    this.apiKey = config.apiKey;
    this.model = config.model || 'deepseek-chat';
    this.temperature = config.temperature || 0;
    this.baseURL = config.baseURL || 'https://api.deepseek.com/v1';
    this.boundTools = config.boundTools || [];
  }

  _llmType() {
    return 'deepseek';
  }

  bindTools(tools, kwargs) {
    const BoundModel = class extends DeepSeekChatModel {
      constructor(parent, boundTools) {
        super({
          apiKey: parent.apiKey,
          model: parent.model,
          temperature: parent.temperature,
          baseURL: parent.baseURL,
          boundTools: boundTools
        });
      }
    };
    return new BoundModel(this, tools);
  }

  _convertZodToJSONSchema(zodSchema) {
    try {
      if (zodSchema && zodSchema._def && zodSchema._def.shape) {
        const shape = zodSchema._def.shape();
        const properties = {};
        const required = [];

        for (const [key, value] of Object.entries(shape)) {
          properties[key] = {
            type: this._getZodType(value),
            description: value._def.description || ''
          };
          if (value._def.typeName !== 'ZodOptional') {
            required.push(key);
          }
        }

        return {
          type: 'object',
          properties,
          ...(required.length > 0 && { required })
        };
      }
      return { type: 'object', properties: {} };
    } catch (e) {
      return { type: 'object', properties: {} };
    }
  }

  _getZodType(zodSchema) {
    if (!zodSchema || !zodSchema._def) return 'string';
    const typeName = zodSchema._def.typeName;
    if (typeName === 'ZodString') return 'string';
    if (typeName === 'ZodNumber') return 'number';
    if (typeName === 'ZodBoolean') return 'boolean';
    if (typeName === 'ZodArray') return 'array';
    if (typeName === 'ZodObject') return 'object';
    return 'string';
  }

  async _generate(messages, options) {
    const formattedMessages = messages
      .filter(msg => msg != null && !Array.isArray(msg))
      .map(msg => {
        if (msg instanceof HumanMessage || (msg.constructor && msg.constructor.name === 'HumanMessage')) {
          return { role: 'user', content: msg.content || '' };
        } else if (msg instanceof AIMessage || (msg.constructor && msg.constructor.name === 'AIMessage')) {
          return { role: 'assistant', content: msg.content || '' };
        } else if (msg instanceof SystemMessage || (msg.constructor && msg.constructor.name === 'SystemMessage')) {
          return { role: 'system', content: msg.content || '' };
        } else if (typeof msg === 'object' && msg.content !== undefined) {
          return { role: msg.role || 'user', content: String(msg.content || '') };
        } else if (typeof msg === 'object' && msg.getContent) {
          const content = msg.getContent();
          const role = msg.constructor?.name === 'HumanMessage' ? 'user' 
                     : msg.constructor?.name === 'AIMessage' ? 'assistant'
                     : msg.constructor?.name === 'SystemMessage' ? 'system'
                     : 'user';
          return { role, content: String(content || '') };
        }
        return { role: 'user', content: String(msg || '') };
      })
      .filter(msg => msg.content !== undefined && msg.content !== null);

    const requestBody = {
      model: this.model,
      messages: formattedMessages,
      temperature: this.temperature,
      stream: false
    };

    if (this.boundTools && this.boundTools.length > 0) {
      const toolsFormat = this.boundTools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description || '',
          parameters: tool.schema ? this._convertZodToJSONSchema(tool.schema) : { type: 'object', properties: {} }
        }
      }));
      requestBody.tools = toolsFormat;
      requestBody.tool_choice = 'auto';
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      const choice = response.data.choices[0];
      const content = choice.message.content || '';
      const toolCalls = choice.message.tool_calls || [];

      const { AIMessage } = require('@langchain/core/messages');
      const message = new AIMessage(content);
      
      if (toolCalls && toolCalls.length > 0) {
        message.tool_calls = toolCalls.map(tc => ({
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments || '{}'),
          id: tc.id
        }));
      }

      return {
        generations: [{
          text: content,
          message: message
        }]
      };
    } catch (error) {
      throw new Error(`DeepSeek API调用失败: ${error.message}`);
    }
  }

  async *_streamResponseChunks(messages, options) {
    
    // console.log('_streamResponseChunks called with messages:', JSON.stringify(messages, null, 2),);
    
    let formattedMessages = [];
    
    if (Array.isArray(messages)) {
      if (messages.length === 0) {
        console.warn('_streamResponseChunks received empty messages array');
        formattedMessages = [{ role: 'user', content: '' }];
      } else {
        
        formattedMessages = messages
          .filter(msg => msg != null)
          .map(msg => {
            if (Array.isArray(msg)) {
              console.warn('_streamResponseChunks: Found nested array in messages:', msg);
              return null;
            }
            
            if (msg instanceof HumanMessage || (msg.constructor && msg.constructor.name === 'HumanMessage')) {
              return { role: 'user', content: msg.content || '' };
            } else if (msg instanceof AIMessage || (msg.constructor && msg.constructor.name === 'AIMessage')) {
              return { role: 'assistant', content: msg.content || '' };
            } else if (msg instanceof SystemMessage || (msg.constructor && msg.constructor.name === 'SystemMessage')) {
              return { role: 'system', content: msg.content || '' };
            } else if (typeof msg === 'object' && msg.content !== undefined) {
              return { role: msg.role || 'user', content: String(msg.content || '') };
            } else if (typeof msg === 'object' && msg.getContent) {
              const content = msg.getContent();
              const role = msg.constructor?.name === 'HumanMessage' ? 'user' 
                         : msg.constructor?.name === 'AIMessage' ? 'assistant'
                         : msg.constructor?.name === 'SystemMessage' ? 'system'
                         : 'user';
              return { role, content: String(content || '') };
            }
            console.warn('_streamResponseChunks: Unknown message format:', typeof msg, msg);
            return { role: 'user', content: String(msg || '') };
          })
          .filter(msg => msg != null && msg.content !== undefined && msg.content !== null);
      }
    } else {
      formattedMessages = [{ role: 'user', content: String(messages || '') }];
    }

    if (formattedMessages.length === 0) {
      console.warn('_streamResponseChunks: No valid messages after processing, using default');
      formattedMessages = [{ role: 'user', content: '' }];
    }
    
    console.log('_streamResponseChunks formattedMessages:', JSON.stringify(formattedMessages, null, 2));

    const requestBody = {
      model: this.model,
      messages: formattedMessages,
      temperature: this.temperature,
      stream: true
    };

    console.log('DeepSeek boundTools count:', this.boundTools?.length || 0);
    
    if (this.boundTools && this.boundTools.length > 0) {
      const toolsFormat = this.boundTools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description || '',
          parameters: tool.schema ? this._convertZodToJSONSchema(tool.schema) : { type: 'object', properties: {} }
        }
      }));
      requestBody.tools = toolsFormat;
      requestBody.tool_choice = 'auto';
    }
    
    // console.log('DeepSeek request messages count:', requestBody.messages.length);
    console.log('DeepSeek has tools:', !!requestBody.tools,'DeepSeek last message:', JSON.stringify(requestBody.messages[requestBody.messages.length - 1]));

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 60000
        }
      );

      let buffer = '';
      let accumulatedToolCalls = {};
      let fullContent = '';
      
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              if (Object.keys(accumulatedToolCalls).length > 0) {
                const toolCalls = Object.values(accumulatedToolCalls).map(tc => ({
                  name: tc.name,
                  args: JSON.parse(tc.arguments || '{}'),
                  id: tc.id,
                  type: 'tool_call'
                }));
                console.log('DeepSeek final tool_calls:', JSON.stringify(toolCalls));
                
                const message = new AIMessageChunk({
                  content: fullContent,
                  tool_call_chunks: toolCalls.map(tc => ({
                    name: tc.name,
                    args: JSON.stringify(tc.args),
                    id: tc.id,
                    index: 0
                  }))
                });
                message.tool_calls = toolCalls;
                
                yield new ChatGenerationChunk({
                  text: fullContent,
                  message: message
                });
              }
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;
              const content = delta?.content || '';
              const toolCallsChunk = delta?.tool_calls;
              
              if (toolCallsChunk && toolCallsChunk.length > 0) {
                for (const tc of toolCallsChunk) {
                  const idx = tc.index || 0;
                  if (!accumulatedToolCalls[idx]) {
                    accumulatedToolCalls[idx] = {
                      id: tc.id || '',
                      name: tc.function?.name || '',
                      arguments: ''
                    };
                  }
                  if (tc.id) accumulatedToolCalls[idx].id = tc.id;
                  if (tc.function?.name) accumulatedToolCalls[idx].name = tc.function.name;
                  if (tc.function?.arguments) accumulatedToolCalls[idx].arguments += tc.function.arguments;
                }
              }
              
              if (content) {
                fullContent += content;
                yield new ChatGenerationChunk({
                  text: content,
                  message: new AIMessageChunk(content)
                });
              }
            } catch (e) {
            }
          }
        }
      }
      
      if (Object.keys(accumulatedToolCalls).length > 0) {
        const toolCalls = Object.values(accumulatedToolCalls).map(tc => ({
          name: tc.name,
          args: JSON.parse(tc.arguments || '{}'),
          id: tc.id,
          type: 'tool_call'
        }));
        console.log('DeepSeek final tool_calls (end of stream):', JSON.stringify(toolCalls));
        
        const message = new AIMessageChunk({
          content: fullContent,
          tool_call_chunks: toolCalls.map(tc => ({
            name: tc.name,
            args: JSON.stringify(tc.args),
            id: tc.id,
            index: 0
          }))
        });
        message.tool_calls = toolCalls;
        
        yield new ChatGenerationChunk({
          text: fullContent,
          message: message
        });
      }
    } catch (error) {
      const errorDetails = error.response 
        ? `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`
        : error.message;
      console.error('DeepSeek API流式调用错误详情:', {
        url: `${this.baseURL}/chat/completions`,
        requestBody: JSON.stringify(requestBody, null, 2),
        error: errorDetails
      });
      throw new Error(`DeepSeek API流式调用失败: ${errorDetails}`);
    }
  }
}

module.exports = DeepSeekChatModel;
