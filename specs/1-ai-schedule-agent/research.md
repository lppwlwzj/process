# AI智能排班助手技术研究文档

## R1: LangChain.js 工具调用和Agent实现

### 决策
使用 LangChain.js (v0.1.x) 的 ReAct Agent 模式，通过 Tool 封装现有 API，实现工具调用能力。

### 方案
1. **Agent类型选择**: ReAct Agent
   - 适合需要工具调用的场景
   - 支持多轮推理和工具选择
   - LangChain.js 官方推荐用于复杂任务

2. **工具封装方式**:
   ```javascript
   const { Tool } = require("@langchain/core/tools");
   
   const queryScheduleTool = new Tool({
     name: "query_schedule",
     description: "查询排班情况",
     func: async (input) => {
       // 调用现有 /api/schedule/list API
       // 返回格式化的排班数据
     }
   });
   ```

3. **Agent配置**:
   ```javascript
   const { ChatOpenAI } = require("@langchain/openai");
   const { AgentExecutor, createReactAgent } = require("langchain/agents");
   
   const model = new ChatOpenAI({ temperature: 0 });
   const agent = await createReactAgent({
     llm: model,
     tools: [queryScheduleTool, ...],
     prompt: customPrompt
   });
   ```

### 理由
- LangChain.js 是 Node.js 生态中成熟的 AI Agent 框架
- ReAct Agent 模式适合需要多步骤推理和工具调用的场景
- 与现有 Express.js 后端集成简单

### 备选方案
- Plan-and-Execute Agent: 适合更复杂的多步骤任务，但会增加延迟
- 自定义 Agent: 灵活性高但开发成本大

## R2: DeepSeek API集成方案

### 决策
创建自定义 LangChain LLM 适配器，封装 DeepSeek API 调用。

### 方案
1. **DeepSeek API 接口**:
   - 端点: `https://api.deepseek.com/v1/chat/completions`
   - 认证: Bearer Token
   - 请求格式: 与 OpenAI 兼容

2. **自定义 LLM 适配器**:
   ```javascript
   const { BaseChatModel } = require("@langchain/core/language_models/chat_models");
   
   class DeepSeekChatModel extends BaseChatModel {
     async _generate(messages, options) {
       const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
           "Content-Type": "application/json"
         },
         body: JSON.stringify({
           model: "deepseek-chat",
           messages: messages,
           temperature: options.temperature || 0
         })
       });
       return response.json();
     }
   }
   ```

3. **配置管理**:
   - 通过环境变量 `AI_MODEL_TYPE` 选择模型（"openai" 或 "deepseek"）
   - 统一接口，Agent 代码无需修改

### 理由
- DeepSeek 提供 OpenAI 兼容的 API，易于集成
- 自定义适配器可以统一接口，便于切换模型
- 成本较低，适合国内使用

### 备选方案
- 使用第三方 LangChain DeepSeek 包（如果存在）
- 直接调用 DeepSeek API，不使用 LangChain（失去框架优势）

## R3: 中文时间表达式解析

### 决策
结合 AI 模型的 NER 能力和自定义时间解析器，处理中文时间表达式。

### 方案
1. **时间表达式模式库**:
   ```javascript
   const timePatterns = {
     "今天": () => new Date(),
     "明天": () => addDays(new Date(), 1),
     "后天": () => addDays(new Date(), 2),
     "今天下午": (hour) => setTime(new Date(), hour, 0),
     "明天上午": (hour) => setTime(addDays(new Date(), 1), hour, 0),
     // ...
   };
   ```

2. **解析流程**:
   - AI 模型提取时间相关文本（"今天下午2点"）
   - 自定义解析器识别模式并转换为绝对时间
   - 处理相对时间（"30分钟后"、"2小时后"）

3. **依赖库**:
   - `dayjs`: 日期处理（项目已有）
   - `dayjs/plugin/relativeTime`: 相对时间支持

### 理由
- AI 模型擅长识别时间相关文本，但时间计算需要精确逻辑
- 自定义解析器可以处理复杂的中文时间表达式
- 结合两者可以平衡准确性和灵活性

### 备选方案
- 完全依赖 AI 模型: 可能不够精确
- 使用中文 NLP 库（如 jieba）: 增加依赖，但可能提升准确性

## R4: 跨会话记忆存储设计

### 决策
使用 MySQL 表存储对话记忆，通过 session_id 和 created_at 索引实现高效检索和30天自动清理。

### 方案
1. **表结构** (已在 plan.md 中定义):
   ```sql
   CREATE TABLE `conversation_memory` (
     `id` int(11) NOT NULL AUTO_INCREMENT,
     `session_id` varchar(100) NOT NULL,
     `user_id` int(11) DEFAULT NULL,
     `role` enum('user','assistant') NOT NULL,
     `content` text NOT NULL,
     `metadata` json DEFAULT NULL,
     `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (`id`),
     KEY `idx_session_id` (`session_id`),
     KEY `idx_created_at` (`created_at`)
   );
   ```

2. **记忆检索策略**:
   - 按 session_id 查询最近 N 条消息（避免 token 超限）
   - 使用 LangChain BufferMemory 管理短期记忆
   - MySQL 存储长期记忆，支持跨会话检索

3. **自动清理机制**:
   ```sql
   DELETE FROM conversation_memory 
   WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
   ```
   - 通过定时任务（cron）或数据库事件执行

4. **记忆压缩**（可选优化）:
   - 将旧消息摘要存储到 metadata
   - 减少存储空间和检索时间

### 理由
- MySQL 是现有技术栈，无需引入新数据库
- 通过索引可以高效检索30天内的对话
- JSON 字段存储 metadata 灵活且易于扩展

### 备选方案
- Redis: 性能更好但需要额外维护，且30天持久化需要配置
- 向量数据库（如 Pinecone）: 适合语义搜索，但增加复杂度

## R5: 实时对话实现（SSE）

### 决策
使用 Server-Sent Events (SSE) 实现服务器到客户端的实时推送，支持流式响应。

### 方案
1. **Server-Sent Events (SSE)**（选定方案）:
   ```javascript
   // 后端：Express.js SSE 端点
   app.post('/api/ai-schedule/chat', async (req, res) => {
     res.setHeader('Content-Type', 'text/event-stream');
     res.setHeader('Cache-Control', 'no-cache');
     res.setHeader('Connection', 'keep-alive');
     
     const { message, session_id } = req.body;
     
     // 流式调用 AI Agent
     const stream = await agent.stream(message);
     for await (const chunk of stream) {
       res.write(`data: ${JSON.stringify(chunk)}\n\n`);
     }
     res.end();
   });
   
   // 前端：EventSource 接收
   const eventSource = new EventSource('/api/ai-schedule/chat', {
     method: 'POST',
     body: JSON.stringify({ message, session_id })
   });
   
   eventSource.onmessage = (event) => {
     const data = JSON.parse(event.data);
     // 处理流式响应
   };
   ```

2. **实现要点**:
   - 客户端通过 HTTP POST 发送消息（包含 session_id）
   - 服务器通过 SSE 流式推送 AI 响应
   - 支持自动重连（浏览器原生支持）
   - 适合 AI 流式响应场景

### 理由
- SSE 比 WebSocket 更简单，无需额外库（浏览器原生支持）
- 适合单向推送场景（服务器→客户端）
- 自动重连机制，提升用户体验
- 支持流式响应，AI 可以逐步返回结果
- 与 Express.js 集成简单，无需 Socket.io

### 备选方案
- WebSocket (Socket.io): 需要双向通信时使用，但增加复杂度
- HTTP 轮询: 简单但效率低，不适合流式响应

## 技术栈总结

### 核心依赖
- `langchain`: ^0.1.0 (核心框架)
- `@langchain/openai`: ^0.1.0 (OpenAI 集成)
- `@langchain/core`: ^0.1.0 (核心工具和类型)
- `dayjs`: ^1.11.0 (已有，时间处理)
- SSE: 浏览器原生支持，无需额外依赖

### 配置需求
- `OPENAI_API_KEY`: OpenAI API 密钥
- `DEEPSEEK_API_KEY`: DeepSeek API 密钥
- `AI_MODEL_TYPE`: "openai" 或 "deepseek"

### 性能优化策略
1. **响应时间优化**:
   - 限制提示词长度
   - 使用流式响应（streaming）
   - 缓存常见查询结果

2. **并发处理**:
   - 使用异步/等待模式
   - 连接池管理数据库连接
   - 考虑消息队列（如 Redis Queue）处理高并发

3. **记忆检索优化**:
   - 限制单次检索的消息数量
   - 使用摘要压缩旧消息
   - 定期清理过期记忆

## R6: VIP优先插入的批量时间顺延算法

### 决策
使用数据库事务确保原子性，按时间顺序批量更新受影响排班，避免重复顺延和并发冲突。

### 方案
1. **受影响排班查询**:
   ```sql
   -- 查询同一诊室、同一日期、插入时间之后的所有排班
   SELECT * FROM schedule 
   WHERE room = ? 
     AND DATE(start_time) = DATE(?)
     AND start_time >= ?
   ORDER BY start_time ASC;
   
   -- 查询同一医生、同一日期、插入时间之后的所有排班
   SELECT * FROM schedule 
   WHERE doctor_id = ? 
     AND DATE(start_time) = DATE(?)
     AND start_time >= ?
   ORDER BY start_time ASC;
   ```

2. **批量顺延算法**:
   ```javascript
   async function delaySchedules(vipSchedule, delayDuration) {
     const connection = await db.getConnection();
     try {
       await connection.beginTransaction();
       
       // 1. 创建VIP排班记录
       const vipScheduleId = await createSchedule(vipSchedule, connection);
       
       // 2. 查询受影响排班（去重，合并诊室和医生的结果）
       const affectedSchedules = await getAffectedSchedules(
         vipSchedule.room,
         vipSchedule.doctor_id,
         vipSchedule.start_time,
         connection
       );
       
       // 3. 按时间顺序排序，避免重复顺延
       affectedSchedules.sort((a, b) => 
         new Date(a.start_time) - new Date(b.start_time)
       );
       
       // 4. 批量更新（按顺序，每个排班往后推delayDuration分钟）
       for (const schedule of affectedSchedules) {
         const newStartTime = addMinutes(schedule.start_time, delayDuration);
         const newEndTime = addMinutes(schedule.end_time, delayDuration);
         
         await connection.query(
           `UPDATE schedule 
            SET start_time = ?, end_time = ? 
            WHERE id = ?`,
           [newStartTime, newEndTime, schedule.id]
         );
       }
       
       await connection.commit();
       return { vipScheduleId, affectedSchedules };
     } catch (error) {
       await connection.rollback();
       throw error;
     } finally {
       connection.release();
     }
   }
   ```

3. **并发控制**:
   - 使用数据库事务确保原子性
   - 使用行级锁（SELECT ... FOR UPDATE）防止并发修改
   - 按时间顺序处理，避免重复顺延

4. **性能优化**:
   - 批量更新而非逐条更新（如果MySQL支持）
   - 使用索引优化查询（room, doctor_id, start_time）
   - 限制单次顺延的排班数量（防止影响过大）

### 理由
- 数据库事务确保数据一致性
- 按时间顺序处理避免重复顺延
- 行级锁防止并发冲突
- 批量更新提升性能

### 备选方案
- 使用消息队列异步处理：增加复杂度，但可以提升响应速度
- 乐观锁（版本号）：适合低并发场景，但需要重试机制
- 分批次处理：适合大量排班场景，但需要更复杂的逻辑

### 实现注意事项
1. **去重处理**: 同一排班可能同时满足诊室和医生条件，需要去重
2. **时间计算**: 使用 dayjs 或 moment.js 进行时间计算，确保时区正确
3. **错误处理**: 如果顺延失败，需要回滚整个事务
4. **日志记录**: 记录所有顺延操作，便于追踪和审计
