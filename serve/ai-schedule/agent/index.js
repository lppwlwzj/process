const { createAgent, HumanMessage, AIMessage, SystemMessage } = require('langchain');
const { createLLM } = require('./config');
const { systemPrompt } = require('./prompt');
const { manageScheduleTool, queryUserTool } = require('../tools/schedule-tools-optimized');
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
      manageScheduleTool,
      queryUserTool,
      queryAvailableResourcesTool
    ];
    this.agent = null;
    this.initializing = null;
  }

  async initialize() {
    if (this.agent) {
      return;
    }
    
    if (this.initializing) {
      return this.initializing;
    }
    
    this.initializing = (async () => {
      try {
        this.agent = createAgent({
          model: this.llm,
          tools: this.tools,
          systemPrompt: systemPrompt
        });
      } catch (error) {
        console.error('Error initializing agent:', error);
        this.initializing = null;
        throw error;
      }
    })();
    
    return this.initializing;
  }

  _buildMessages(chatHistory, userMessage) {
    const messages = [];
    
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-4);
      
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.type === 'human') {
          messages.push(new HumanMessage(msg.content || msg.text || ''));
        } else if (msg.role === 'assistant' || msg.type === 'ai') {
          const content = msg.content || msg.text || '';
          const truncated = content.length > 500 ? content.substring(0, 500) + '...' : content;
          messages.push(new AIMessage(truncated));
        }
      }
    }
    
    messages.push(new HumanMessage(userMessage));
    
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

  async *streamMessage(sessionId, userId, userMessage, extractedInfo = null) {
    try {
      const perfStart = Date.now();
      
      if (!this.agent) {
        await this.initialize();
      }

      if (!extractedInfo) {
        extractedInfo = extractScheduleInfo(userMessage);
      }
      
      const memoryStart = Date.now();
      const [, shortTermMemory] = await Promise.all([
        this.memoryManager.saveToLongTerm(
          sessionId,
          userId,
          'user',
          userMessage,
          { extracted_info: extractedInfo }
        ),
        Promise.resolve(this.memoryManager.getShortTermMemory(sessionId))
      ]);
      
      const [longTermHistory, memoryVariables] = await Promise.all([
        this.memoryManager.loadLongTermMemory(sessionId),
        shortTermMemory.loadMemoryVariables({})
      ]);
      console.log(`[PERF] Memory loaded: ${Date.now() - memoryStart}ms`);
      
      const buildStart = Date.now();
      const chatHistory = memoryVariables.chat_history || [];
      const allHistory = [...(longTermHistory.messages || []), ...chatHistory];
      const messages = this._buildMessages(allHistory, userMessage);
      console.log(`[PERF] Messages built: ${Date.now() - buildStart}ms, messages: ${messages.length}`);

      let fullResponse = '';
      let hasYieldedChunk = false;
      const aiStart = Date.now();
      let toolCallCount = 0;

      try {
        const streamEvents = this.agent.streamEvents({ messages }, { version: "v2" });

        for await (const event of streamEvents) {
          if (event.event === 'on_tool_start') {
            toolCallCount++;
            console.log(`[PERF] Tool call #${toolCallCount} started: ${event.name}, elapsed: ${Date.now() - perfStart}ms`);
          } else if (event.event === 'on_tool_end') {
            console.log(`[PERF] Tool call ended: ${event.name}, elapsed: ${Date.now() - perfStart}ms`);
          } else if (event.event === 'on_chat_model_stream' || event.event === 'on_llm_stream') {
            if (!hasYieldedChunk) {
              console.log(`[PERF] First token: ${Date.now() - aiStart}ms, total: ${Date.now() - perfStart}ms, tools called: ${toolCallCount}`);
            }
            
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
                  yield { type: 'chunk', content: fullResponse };
                }
              }
            }
          }
        }

        if (!hasYieldedChunk || fullResponse.length === 0) {
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
      
      console.log(`[PERF] Total completed: ${Date.now() - perfStart}ms, tool calls: ${toolCallCount}`);

      await Promise.all([
        shortTermMemory.saveContext(
          { input: userMessage },
          { output: fullResponse }
        ),
        this.memoryManager.saveToLongTerm(
          sessionId,
          userId,
          'assistant',
          fullResponse,
          {}
        )
      ]);

      yield { type: 'complete', response: fullResponse, extracted_info: extractedInfo };
    } catch (error) {
      console.error('Error in streamMessage--->', error);
      yield { 
        type: 'complete', 
        response: `处理消息时出错: ${error.message}`,
        extracted_info: extractedInfo || {}
      };
    }
  }
}

module.exports = ScheduleAgent;
