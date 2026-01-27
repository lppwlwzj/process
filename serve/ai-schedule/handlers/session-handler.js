const { v4: uuidv4 } = require('uuid');
const MemoryManager = require('../memory/manager');

const memoryManager = new MemoryManager();

function createSession(userId) {
  return {
    session_id: uuidv4(),
    user_id: userId,
    created_at: new Date()
  };
}

async function getSessionHistory(sessionId) {
  return new Promise((resolve, reject) => {
    memoryManager.loadLongTermMemory(sessionId)
      .then(history => {
        const messages = history.messages.map(msg => ({
          role: msg.constructor.name === 'HumanMessage' ? 'user' : 'assistant',
          content: msg.content
        }));
        resolve(messages);
      })
      .catch(reject);
  });
}

async function deleteSession(sessionId) {
  return memoryManager.deleteSessionMemory(sessionId);
}

module.exports = {
  createSession,
  getSessionHistory,
  deleteSession
};
