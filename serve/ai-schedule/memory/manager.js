const { createShortTermMemory } = require('./short-term');
const { saveMessage, getRecentMessages, cleanupOldMessages, deleteSession } = require('./long-term');
const { InMemoryChatMessageHistory } = require('@langchain/core/chat_history');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');

class MemoryManager {
  constructor() {
    this.shortTermMemories = new Map();
  }

  getShortTermMemory(sessionId) {
    if (!this.shortTermMemories.has(sessionId)) {
      this.shortTermMemories.set(sessionId, createShortTermMemory());
    }
    return this.shortTermMemories.get(sessionId);
  }

  async loadLongTermMemory(sessionId) {
    return new Promise((resolve, reject) => {
      getRecentMessages(sessionId, null, async (err, messages) => {
        if (err) {
          reject(err);
          return;
        }

        const history = new InMemoryChatMessageHistory();
        for (const msg of messages) {
          if (msg.role === 'user') {
            await history.addMessage(new HumanMessage(msg.content));
          } else if (msg.role === 'assistant') {
            await history.addMessage(new AIMessage(msg.content));
          }
        }

        resolve({ messages: await history.getMessages() });
      });
    });
  }

  async saveToLongTerm(sessionId, userId, role, content, metadata) {
    return new Promise((resolve, reject) => {
      saveMessage(sessionId, userId, role, content, metadata, (err, id) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(id);
      });
    });
  }

  async deleteSessionMemory(sessionId) {
    return new Promise((resolve, reject) => {
      deleteSession(sessionId, (err, count) => {
        if (err) {
          reject(err);
          return;
        }
        this.shortTermMemories.delete(sessionId);
        resolve(count);
      });
    });
  }

  async cleanup() {
    return new Promise((resolve, reject) => {
      cleanupOldMessages((err, count) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(count);
      });
    });
  }
}

module.exports = MemoryManager;
