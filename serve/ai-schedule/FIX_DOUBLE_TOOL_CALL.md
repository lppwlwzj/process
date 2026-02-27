# 修复：AI调用2次工具的问题

## 问题现象

创建排班时：
```
[PERF] Total completed: 27067ms, tool calls: 2
```

**耗时27秒，调用了2次工具**，说明AI先query查询，再create创建。

## 根本原因

1. **Prompt不够明确** - 没有明确禁止创建前先query
2. **工具描述不清晰** - 没有强调创建时直接调用
3. **AI行为模式** - gpt-3.5-turbo倾向于先查询再操作

## 已实施的修复

### ✅ 修复1: 强化Prompt

**修改文件**: `agent/prompt.js`

**关键改动**:
- 明确说明：**"禁止先query再create！"**
- 强调：创建时直接调用，工具会自动处理所有事情
- 添加流程说明，明确禁止先查询

### ✅ 修复2: 优化工具描述

**修改文件**: `tools/schedule-tools-optimized.js`

**关键改动**:
```javascript
description: '统一的排班管理工具。创建排班时直接调用action=create，工具会自动查找医生、检测冲突、分配诊室，无需先query查询。'
```

## 预期效果

修复后应该看到：
```
[PERF] Total completed: <5000ms, tool calls: 1  ✅
```

而不是：
```
[PERF] Total completed: 27067ms, tool calls: 2  ❌
```

## 测试步骤

1. **重启服务**
2. **测试创建排班**：
   ```
   今天下午13点插入排班，于医生、戴牙、客户李喜
   ```
3. **查看日志**：
   ```
   [TOOL] manage_schedule called, action: create
   [PERF] Tool call #1 started: manage_schedule
   [PERF] Total completed: XXms, tool calls: 1
   ```

## 如果还是调用2次工具

### 方案A: 在消息中添加提示

修改 `agent/index.js` 的 `_buildMessages`：

```javascript
_buildMessages(chatHistory, userMessage) {
  // ... 现有代码 ...
  
  // 检测创建意图
  const isCreateIntent = /(创建|插入|安排|添加).*排班|排班.*(创建|插入|安排)/.test(userMessage);
  const hasCompleteInfo = /(医生|客户|项目|时间)/.test(userMessage);
  
  if (isCreateIntent && hasCompleteInfo) {
    messages.push(new HumanMessage(`重要提示：创建排班时直接调用manage_schedule(action='create')，不要先query查询。\n\n用户说：${userMessage}`));
  } else {
    messages.push(new HumanMessage(userMessage));
  }
  
  return messages;
}
```

### 方案B: 使用更强的模型

如果gpt-3.5-turbo还是不够听话，可以尝试：
- gpt-4（更准确但更慢）
- 或者继续用deepseek-chat但优化Prompt

### 方案C: 代码层面拦截

在工具调用时检测：
```javascript
// 如果检测到先query再create，警告并跳过query
if (lastToolCall === 'query' && currentAction === 'create') {
  console.warn('[WARN] AI called query before create, skipping query');
  // 直接执行create
}
```

## 监控指标

关键指标：
- **tool calls**: 应该 = 1（创建时）
- **Total completed**: 应该 < 5000ms
- **Tool call #1**: 应该是 create，不是 query

## 当前状态

✅ Prompt已强化
✅ 工具描述已优化
⏳ 等待测试验证

---

**请重启服务测试，查看是否只调用1次工具！**
