const { InMemoryChatMessageHistory } = require('@langchain/core/chat_history');
const { BaseMemory } = require('@langchain/core/memory');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');

class BufferMemory extends BaseMemory {
  constructor(fields = {}) {
    super();
    this.chatHistory = fields.chatHistory || new InMemoryChatMessageHistory();
    this.returnMessages = fields.returnMessages ?? false;
    this.memoryKey = fields.memoryKey ?? 'chat_history';
  }

  async loadMemoryVariables(_values) {
    const messages = await this.chatHistory.getMessages();
    if (this.returnMessages) {
      return { [this.memoryKey]: messages };
    } else {
      return { [this.memoryKey]: messages.map(m => m.content).join('\n') };
    }
  }

  async saveContext(inputValues, outputValues) {
    const input = inputValues.input || inputValues[Object.keys(inputValues)[0]];
    const output = outputValues.output || outputValues[Object.keys(outputValues)[0]];
    
    if (input) {
      await this.chatHistory.addMessage(new HumanMessage(input));
    }
    if (output) {
      await this.chatHistory.addMessage(new AIMessage(output));
    }
  }
}

function createShortTermMemory() {
  return new BufferMemory({
    returnMessages: true,
    memoryKey: 'chat_history'
  });
}

module.exports = {
  createShortTermMemory,
  BufferMemory
};
