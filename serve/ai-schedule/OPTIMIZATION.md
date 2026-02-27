# AI排班助手性能优化说明

## 优化内容

### 1. Agent单例复用 (优化200-500ms)
**问题:** 每次请求都重新初始化Agent
**解决方案:**
- 应用启动时初始化Agent一次
- 在 `app.js` 中调用 `initializeAgent()` 预热
- 增加初始化状态锁，防止并发初始化

**改动文件:**
- `serve/app.js`: 添加启动时初始化
- `serve/ai-schedule/agent/index.js`: 增加初始化锁机制
- `serve/ai-schedule/handlers/chat-handler.js`: 导出初始化函数

### 2. 历史消息缓存 (优化50-200ms)
**问题:** 每次请求都查询数据库加载历史消息
**解决方案:**
- 在 MemoryManager 中增加内存缓存
- 缓存有效期5分钟
- 保存新消息时自动清除缓存

**改动文件:**
- `serve/ai-schedule/memory/manager.js`: 添加 longTermCache 和 cacheTTL

### 3. 提取信息只做一次 (优化10-30ms)
**问题:** `extractScheduleInfo` 在 handler 和 agent 中被调用2次
**解决方案:**
- 在 handler 中提取一次
- 将结果作为参数传递给 agent.streamMessage()

**改动文件:**
- `serve/ai-schedule/handlers/chat-handler.js`: 只调用一次并传递
- `serve/ai-schedule/agent/index.js`: streamMessage 接收 extractedInfo 参数

### 4. 并行化数据库查询 (优化30-100ms)
**问题:** handleDirectInsert 中3个数据库操作串行执行
**解决方案:**
- 医生查询和诊室查询使用 Promise.all 并行执行

**改动文件:**
- `serve/ai-schedule/handlers/chat-handler.js`: handleDirectInsert 函数优化

### 5. 减少调试日志 (优化50-150ms)
**问题:** 
- 每个事件都JSON序列化打印
- DeepSeek适配器打印大量调试信息
- Agent流处理打印详细日志

**解决方案:**
- 移除非关键日志
- 只保留错误日志
- 减少JSON序列化操作

**改动文件:**
- `serve/ai-schedule/agent/index.js`: 移除详细日志
- `serve/ai-schedule/agent/deepseek-adapter.js`: 清理调试日志
- `serve/ai-schedule/handlers/chat-handler.js`: 移除非必要日志

### 6. Promise并行化 (优化20-50ms)
**问题:** Agent中多个异步操作串行执行
**解决方案:**
- 短期记忆和长期记忆加载并行
- 记忆保存操作并行

**改动文件:**
- `serve/ai-schedule/agent/index.js`: 使用 Promise.all 并行化

## 预期收益

### 首次响应时间
- 优化前: 1.5-3秒
- 优化后: 0.5-1秒
- **提升约60-70%**

### 流式输出开始时间
- 优化前: 2-4秒
- 优化后: 1-2秒
- **提升约50%**

### 直接插入路径
- 优化前: 200-500ms
- 优化后: 100-200ms
- **提升约50%**

## 使用注意事项

1. **应用启动时间会增加约1秒** (用于Agent预初始化)
2. **内存占用会增加约10-20MB** (历史消息缓存)
3. **缓存过期时间为5分钟**，如需调整可修改 `memory/manager.js` 中的 `cacheTTL`

## 回滚方案

如需回滚优化，按以下步骤操作：

1. 移除 `app.js` 中的 `initializeAgent()` 调用
2. 恢复 `agent/index.js` 中的 `initialize()` 方法为原版本
3. 移除 `memory/manager.js` 中的缓存机制
4. 恢复 `chat-handler.js` 中的日志输出

## 性能监控建议

建议监控以下指标：
- Agent初始化时间
- 数据库查询耗时
- 历史消息加载耗时
- DeepSeek API响应时间
- 端到端请求耗时

可在关键路径添加时间戳记录：
```javascript
const startTime = Date.now();
// ... 操作
console.log(`操作耗时: ${Date.now() - startTime}ms`);
```
