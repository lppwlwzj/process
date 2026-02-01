---
name: DeepSeek AI 响应优化
overview: 通过简单意图快速路由、并行/异步操作、减少 LLM 调用轮数等方式，优化 AI 响应速度，预计将典型排班请求从 4-9s 降低到 2-4s。
todos:
  - id: parallel-memory
    content: 阶段一：并行加载内存 + 异步保存
    status: pending
  - id: intent-router
    content: 阶段二：简单意图快速路由
    status: pending
  - id: reduce-llm-calls
    content: 阶段三：优化工具设计，减少 LLM 调用轮数
    status: pending
  - id: pre-init-agent
    content: 阶段四：预初始化 Agent
    status: pending
isProject: false
---

# DeepSeek AI 响应速度优化计划

## 当前问题

典型排班请求耗时 4-9s，主要瓶颈：

- DeepSeek API 调用（1.5-3s/轮，可能 2-3 轮）
- 内存加载串行执行
- 数据库保存阻塞主流程

## 优化方案

### 阶段一：减少阻塞时间（预计减少 200-400ms）

**1.1 并行加载内存**

修改 [serve/ai-schedule/agent/index.js](serve/ai-schedule/agent/index.js) 中的 `streamMessage` 方法：

```javascript
// 当前串行执行
const shortTermMemory = this.memoryManager.getShortTermMemory(sessionId);
const longTermHistory = await this.memoryManager.loadLongTermMemory(sessionId);
const memoryVariables = await shortTermMemory.loadMemoryVariables({});

// 优化为并行执行
const shortTermMemory = this.memoryManager.getShortTermMemory(sessionId);
const [longTermHistory, memoryVariables] = await Promise.all([
  this.memoryManager.loadLongTermMemory(sessionId),
  shortTermMemory.loadMemoryVariables({})
]);
```

**1.2 异步保存用户消息**

流开始前的保存改为不等待：

```javascript
// 当前阻塞执行
await this.memoryManager.saveToLongTerm(sessionId, userId, 'user', userMessage, ...);

// 优化为异步执行（不等待）
this.memoryManager.saveToLongTerm(sessionId, userId, 'user', userMessage, ...)
  .catch(err => console.error('保存用户消息失败:', err));
```

**1.3 流结束后并行保存**

```javascript
// 当前串行执行
await shortTermMemory.saveContext(...);
await this.memoryManager.saveToLongTerm(...);

// 优化为并行执行
await Promise.all([
  shortTermMemory.saveContext(...),
  this.memoryManager.saveToLongTerm(...)
]);
```

---

### 阶段二：简单意图快速路由（特定场景从 3s+ 降到 <100ms）

**2.1 添加简单意图识别器**

新建 [serve/ai-schedule/utils/intent-router.js](serve/ai-schedule/utils/intent-router.js)：

```javascript
const GREETING_PATTERNS = [
  /^(你好|您好|hi|hello|早上好|下午好|晚上好|嗨|hey)/i,
  /^(谢谢|感谢|多谢|thanks|thank you)/i,
  /^(好的|明白|知道了|收到|ok|okay)/i
];

const GREETING_RESPONSES = {
  greeting: "你好！我是排班助手，有什么可以帮您的吗？",
  thanks: "不客气！还有其他需要帮助的吗？",
  confirm: "好的，有需要随时告诉我。"
};

function matchSimpleIntent(message) {
  // 返回 { matched: boolean, response?: string }
}
```

**2.2 在 chat-handler 中集成快速路由**

修改 [serve/ai-schedule/handlers/chat-handler.js](serve/ai-schedule/handlers/chat-handler.js)：

```javascript
async function* streamChatMessage(sessionId, userId, message) {
  // 先检查简单意图
  const simpleIntent = matchSimpleIntent(message);
  if (simpleIntent.matched) {
    yield { type: "chunk", content: simpleIntent.response };
    yield {
      type: "complete",
      response: simpleIntent.response,
      extracted_info: {}
    };
    return;
  }
  // 继续原有逻辑...
}
```

---

### 阶段三：减少 LLM 调用轮数（预计减少 1.5-3s）

**3.1 优化 create_schedule 工具**

修改 [serve/ai-schedule/tools/schedule-tools.js](serve/ai-schedule/tools/schedule-tools.js) 中的 `createScheduleTool`：

当前：Agent 需要先调用 `query_user` 查医生，再调用 `create_schedule`

优化：`create_schedule` 内部自动处理用户查询，接受医生名字而非 ID

**3.2 合并相似工具**

考虑合并 `query_user` 和 `query_customer`，减少工具数量，降低 DeepSeek 决策时间。

---

### 阶段四：预初始化 Agent（首次请求减少 500ms-1s）

**4.1 服务启动时初始化**

修改 [serve/ai-schedule/handlers/chat-handler.js](serve/ai-schedule/handlers/chat-handler.js)：

```javascript
const agent = new ScheduleAgent();

// 服务启动时预初始化
(async () => {
  try {
    await agent.initialize();
    console.log("Agent 预初始化完成");
  } catch (err) {
    console.error("Agent 预初始化失败:", err);
  }
})();
```

---

## 预期效果

| 场景 | 优化前 | 优化后 |

| -------------------------- | ------ | ------ |

| 简单问候 | 3-5s | <100ms |

| 单轮排班查询 | 3-5s | 2-3s |

| 创建排班（需多轮工具调用） | 6-9s | 3-5s |

## 实施顺序

建议按阶段顺序实施，每个阶段完成后可独立测试效果。
