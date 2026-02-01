const { createAgent, HumanMessage, AIMessage, SystemMessage } = require('langchain');
const { createLLM } = require('./config');
const { systemPrompt } = require('./prompt');
const { queryScheduleTool, checkConflictTool, createScheduleTool, vipPriorityInsertTool, delaySchedulesTool, updateScheduleTool } = require('../tools/schedule-tools');
const { queryUserTool, queryCustomerTool } = require('../tools/user-tools');
const { queryAvailableResourcesTool } = require('../tools/resource-tools');
const MemoryManager = require('../memory/manager');
const { extractScheduleInfo } = require('../parsers/info-extractor');
const { needsConflictCheck } = require('../utils/project-type-checker');
const { getProjectDuration } = require('../utils/project-duration');
const { findAvailableRooms, getProjectDefaultDuration } = require('../utils/resource-allocator');

class ScheduleAgent {
  constructor() {
    this.llm = createLLM();
    this.memoryManager = new MemoryManager();
    this.tools = [
      queryScheduleTool,
      checkConflictTool,
      createScheduleTool,
      updateScheduleTool,
      vipPriorityInsertTool,
      delaySchedulesTool,
      queryUserTool,
      queryCustomerTool,
      queryAvailableResourcesTool
    ];
    this.agent = null;
  }

  async initialize() {
    try {
      this.agent = createAgent({
        model: this.llm,
        tools: this.tools,
        systemPrompt: systemPrompt
      });
    } catch (error) {
      console.error('Error initializing agent:', error);
      throw error;
    }
  }

  _buildMessages(chatHistory, userMessage) {
    const messages = [];
    
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-10);
      
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.type === 'human') {
          messages.push(new HumanMessage(msg.content || msg.text || ''));
        } else if (msg.role === 'assistant' || msg.type === 'ai') {
          messages.push(new AIMessage(msg.content || msg.text || ''));
        }
      }
    }
    
    const currentRequestHint = `【新请求】以下是用户的当前请求，请基于这条消息重新处理，如果用户修改了之前提到的信息（如医生名、客户名等），请使用新的信息重新调用工具查询，不要参考历史对话中的工具调用结果。

用户说：${userMessage}`;
    
    messages.push(new HumanMessage(currentRequestHint));
    
    return messages;
  }

  _extractResponse(result) {
    if (result.messages && Array.isArray(result.messages)) {
      const lastAIMessage = [...result.messages].reverse().find(
        msg => msg.constructor?.name === 'AIMessage' || msg.constructor?.name === 'AIMessageChunk'
      );
      if (lastAIMessage && lastAIMessage.content) {
        return typeof lastAIMessage.content === 'string' 
          ? lastAIMessage.content 
          : String(lastAIMessage.content);
      }
    }
    
    if (result.output) return result.output;
    if (result.text) return result.text;
    if (result.content) return result.content;
    
    return '抱歉，我暂时无法处理这个问题。';
  }

  async processMessage(sessionId, userId, userMessage) {
    if (!this.agent) {
      await this.initialize();
    }

    const extractedInfo = extractScheduleInfo(userMessage);
    
    const shortTermMemory = this.memoryManager.getShortTermMemory(sessionId);
    const longTermHistory = await this.memoryManager.loadLongTermMemory(sessionId);
    
    const memoryVariables = await shortTermMemory.loadMemoryVariables({});
    const chatHistory = memoryVariables.chat_history || [];

    const allHistory = [...(longTermHistory.messages || []), ...chatHistory];
    const messages = this._buildMessages(allHistory, userMessage);

    const result = await this.agent.invoke({ messages });

    const output = this._extractResponse(result);

    await shortTermMemory.saveContext(
      { input: userMessage },
      { output: output }
    );

    await this.memoryManager.saveToLongTerm(
      sessionId,
      userId,
      'user',
      userMessage,
      { extracted_info: extractedInfo }
    );

    await this.memoryManager.saveToLongTerm(
      sessionId,
      userId,
      'assistant',
      output,
      { tool_calls: result.intermediateSteps || [] }
    );

    return {
      response: output,
      extracted_info: extractedInfo,
      tool_calls: result.intermediateSteps || []
    };
  }

  async *streamMessage(sessionId, userId, userMessage) {
    try {
      console.log('streamMessage--->', sessionId, userId, userMessage);

      if (!this.agent) {
        console.log('Initializing agent...');
        await this.initialize();
        console.log('Agent initialized');
      }

      const extractedInfo = extractScheduleInfo(userMessage);
      console.log('extractedInfo in streamMessage--->', extractedInfo);
      
      await this.memoryManager.saveToLongTerm(
        sessionId,
        userId,
        'user',
        userMessage,
        { extracted_info: extractedInfo }
      );
      
      const shortTermMemory = this.memoryManager.getShortTermMemory(sessionId);
      const longTermHistory = await this.memoryManager.loadLongTermMemory(sessionId);
      
      const memoryVariables = await shortTermMemory.loadMemoryVariables({});
      const chatHistory = memoryVariables.chat_history || [];

      const allHistory = [...(longTermHistory.messages || []), ...chatHistory];
      const messages = this._buildMessages(allHistory, userMessage);
      
      console.log('Built messages for agent:', messages.length, 'messages');

      let fullResponse = '';
      let chunkCount = 0;
      let hasYieldedChunk = false;

      try {
        const streamEvents = this.agent.streamEvents({ messages }, { version: "v2" });

        for await (const event of streamEvents) {
          chunkCount++;
          const eventStr = JSON.stringify(event);
          console.log(`Event ${chunkCount} [${event.event}] [${event.name}]--->`, eventStr.substring(0, 400));

          if (event.event === 'on_chat_model_stream' || event.event === 'on_llm_stream') {
            const chunk = event.data?.chunk;
            let content = '';
            
            if (chunk) {
              if (typeof chunk === 'string') {
                content = chunk;
              } else if (chunk.content) {
                content = typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
              } else if (chunk.text) {
                content = typeof chunk.text === 'string' ? chunk.text : String(chunk.text);
              } else if (chunk.message?.content) {
                content = typeof chunk.message.content === 'string' ? chunk.message.content : String(chunk.message.content);
              }
            }
            
            if (content && content.trim()) {
              fullResponse += content;
              hasYieldedChunk = true;
              console.log(`Yielding chunk content: ${content.substring(0, 100)}`);
              yield { type: 'chunk', content: content };
            }
          } else if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
            const output = event.data?.output;
            if (output && output.messages && Array.isArray(output.messages)) {
              const lastAIMessage = [...output.messages].reverse().find(
                msg => msg.constructor?.name === 'AIMessage' || 
                       msg.constructor?.name === 'AIMessageChunk' ||
                       (msg.kwargs && msg.id && msg.id.includes('AIMessage'))
              );
              if (lastAIMessage) {
                const content = lastAIMessage.content || lastAIMessage.kwargs?.content || '';
                if (content && !hasYieldedChunk) {
                  fullResponse = typeof content === 'string' ? content : String(content);
                  hasYieldedChunk = true;
                  console.log(`Yielding final output from LangGraph chain_end: ${fullResponse.substring(0, 100)}`);
                  yield { type: 'chunk', content: fullResponse };
                }
              }
            }
          } else if (event.event === 'on_tool_start' || event.event === 'on_tool_end') {
            console.log(`Tool event: ${event.event}, tool: ${event.name}`);
          }
        }

        console.log(`Stream completed, total events: ${chunkCount}, fullResponse length: ${fullResponse.length}, hasYieldedChunk: ${hasYieldedChunk}`);

        if (!hasYieldedChunk || fullResponse.length === 0) {
          console.warn('No chunks were yielded from streamEvents, trying agent.invoke...');
          try {
            const result = await this.agent.invoke({ messages });
            fullResponse = this._extractResponse(result);
            if (!hasYieldedChunk) {
              yield { type: 'chunk', content: fullResponse };
              hasYieldedChunk = true;
            }
          } catch (invokeError) {
            console.error('Error invoking agent:', invokeError);
            fullResponse = '抱歉，我暂时无法处理这个问题。';
            if (!hasYieldedChunk) {
              yield { type: 'chunk', content: fullResponse };
            }
          }
        }
      } catch (streamError) {
        console.error('Error in streamEvents:', streamError);
        console.error('Error stack:', streamError.stack);
        
        console.log('Trying agent.invoke as fallback...');
        try {
          const result = await this.agent.invoke({ messages });
          fullResponse = this._extractResponse(result);
          if (!hasYieldedChunk) {
            yield { type: 'chunk', content: fullResponse };
            hasYieldedChunk = true;
          }
        } catch (invokeError) {
          console.error('Error invoking agent:', invokeError);
          fullResponse = '抱歉，我暂时无法处理这个问题。';
          if (!hasYieldedChunk) {
            yield { type: 'chunk', content: fullResponse };
          }
        }
      }

      await shortTermMemory.saveContext(
        { input: userMessage },
        { output: fullResponse }
      );

      await this.memoryManager.saveToLongTerm(
        sessionId,
        userId,
        'assistant',
        fullResponse,
        {}
      );

      yield { type: 'complete', response: fullResponse, extracted_info: extractedInfo };
    } catch (error) {
      console.error('Error in streamMessage--->', error);
      yield { 
        type: 'complete', 
        response: `处理消息时出错: ${error.message}`,
        extracted_info: {}
      };
    }
  }
}

module.exports = ScheduleAgent;
