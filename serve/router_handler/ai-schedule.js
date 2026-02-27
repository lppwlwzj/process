const { streamChatMessage, processChatMessage, confirmSchedule } = require('../ai-schedule/handlers/chat-handler');
const { getSessionHistory, deleteSession } = require('../ai-schedule/handlers/session-handler');
const { createSession } = require('../ai-schedule/handlers/session-handler');
const config = require('../ai-schedule/config');

exports.chat = async (req, res) => {
  const { session_id, message, user_id } = req.body;

  if (!message) {
    return res.status(400).json({
      code: 1,
      message: '消息内容不能为空'
    });
  }
  
  const sessionId = session_id || createSession(user_id).session_id;
  const userId = user_id || null;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, config.sse.heartbeatInterval);
  
  const timeout = setTimeout(() => {
    clearInterval(heartbeatInterval);
    res.end();
  }, config.sse.connectionTimeout);
  
  try {
    for await (const chunk of streamChatMessage(sessionId, userId, message)) {
      console.log('Received chunk--->', chunk);
      if (chunk.type === 'chunk') {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`);
      } else if (chunk.type === 'complete') {
        clearInterval(heartbeatInterval);
        clearTimeout(timeout);
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          data: {
            session_id: sessionId,
            response: chunk.response || chunk.data?.response,
            extracted_info: chunk.extracted_info || chunk.data?.extracted_info,
            requires_confirmation: chunk.data?.requires_confirmation || false,
            has_conflict: chunk.data?.has_conflict || false
          }
        })}\n\n`);
        res.end();
        return;
      }
    }
    console.log('Stream iteration completed');
  } catch (error) {
    console.error('Error in streamChatMessage handler--->', error);
    clearInterval(heartbeatInterval);
    clearTimeout(timeout);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: error.message 
    })}\n\n`);
    res.end();
  }
};

exports.history = async (req, res) => {
  const { session_id } = req.params;
  
  try {
    const history = await getSessionHistory(session_id);
    res.json({
      code: 0,
      message: '成功',
      data: {
        session_id: session_id,
        messages: history
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: `查询历史失败: ${error.message}`
    });
  }
};

exports.deleteSession = async (req, res) => {
  const { session_id } = req.params;
  
  try {
    const count = await deleteSession(session_id);
    res.json({
      code: 0,
      message: '成功',
      data: {
        deleted_count: count
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: `删除会话失败: ${error.message}`
    });
  }
};

exports.confirm = async (req, res) => {
  const { session_id, suggested_schedule, is_vip_priority } = req.body;
  
  if (!suggested_schedule) {
    return res.status(400).json({
      code: 1,
      message: '排班信息不能为空'
    });
  }
  
  try {
    const result = await confirmSchedule(session_id, suggested_schedule, is_vip_priority || false);
    res.json({
      code: 0,
      message: '成功',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: `确认排班失败: ${error.message}`
    });
  }
};

exports.vipInsert = async (req, res) => {
  const { suggested_schedule } = req.body;
  
  if (!suggested_schedule) {
    return res.status(400).json({
      code: 1,
      message: '排班信息不能为空'
    });
  }
  
  try {
    const result = await confirmSchedule(null, suggested_schedule, true);
    res.json({
      code: 0,
      message: '成功',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: `VIP优先插入失败: ${error.message}`
    });
  }
};
