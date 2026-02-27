# AI响应慢诊断与修复

## 当前状态

✅ 已完成优化：
- Prompt精简: 111行 → 27行
- 工具合并: 9个 → 3个
- 历史消息: 5轮 → 2轮
- 性能监控: 已添加

❌ 实际测试结果：
- **预期**: 3-4秒
- **实际**: 23.9秒 (比优化前更慢！)

## 问题分析

### 从日志看瓶颈

```
[PERF] Memory loaded: 36ms     ✅ 快
[PERF] Messages built: 1ms     ✅ 快
[PERF] Total completed: 23922ms ❌ 太慢
```

**结论**: 问题不在我们优化的部分，在于AI执行阶段

### 可能原因

1. **AI调用了多次工具**
   - 可能先query查询，再create创建
   - 每次工具调用都要等DeepSeek API响应

2. **冲突检测耗时**
   - 戴牙项目需要冲突检测
   - 可能触发了复杂的数据库查询

3. **DeepSeek API响应慢**
   - 网络延迟
   - 模型推理时间长

4. **工具调用往返多次**
   - AI思考 → 工具调用 → AI再思考 → 再调用

## 进一步诊断

### 查看详细日志

重启服务后测试，查看：
```
[TOOL] manage_schedule called, action: create
[TOOL] manage_schedule completed in XXms

[PERF] Tool call #1 started: manage_schedule
[PERF] Tool call ended: manage_schedule
[PERF] First token: XXms, tools called: X
```

关键指标：
- 工具被调用了几次？
- 每次工具调用耗时多久？
- AI首token响应时间？

### 对比测试

测试简单场景（不需要冲突检测）：
```
"今天下午13点，于医生、面诊、客户李喜"
```

如果面诊很快，戴牙很慢，说明是冲突检测的问题。

## 修复方案

### 方案1: 进一步精简Prompt（已实施）

修改后的Prompt：
- 强调"直接调用create，不要先query"
- 减少AI决策步骤

### 方案2: 禁用冲突检测（临时测试）

在 `schedule-tools-optimized.js` 中临时注释冲突检测：
```javascript
// 临时测试：跳过冲突检测
// if (needsConflictCheck(project) && !['何锐', '孙韩宇'].some(n => doctor_name.includes(n))) {
//   ...冲突检测...
// } else {
  await insertSchedule(...);
// }
```

### 方案3: 切换到更快的模型

修改 `.env`:
```
AI_MODEL_TYPE=openai
OPENAI_MODEL=gpt-3.5-turbo
```

gpt-3.5-turbo比deepseek-chat快很多。

### 方案4: 添加工具调用超时

在 `agent/config.js`:
```javascript
timeout: 10000  // 10秒超时
```

### 方案5: 简化工具返回内容

工具返回的JSON太详细，可以精简：
```javascript
// 简化返回
resolve(JSON.stringify({ 
  success: true, 
  id: results.insertId 
}));

// 而不是返回大量详情
```

## 测试步骤

1. **重启服务**
2. **测试简单场景**（面诊）
3. **测试复杂场景**（戴牙）
4. **对比耗时**
5. **查看日志中的tool call次数和耗时**

## 快速测试命令

```bash
# 查看最近的性能日志
tail -f /path/to/log | grep PERF

# 查看工具调用日志  
tail -f /path/to/log | grep TOOL
```

## 预期结果

如果修复成功，应该看到：
```
[PERF] Memory loaded: <50ms
[PERF] Messages built: <10ms
[PERF] Tool call #1 started: manage_schedule, elapsed: ~100ms
[TOOL] manage_schedule called, action: create
[TOOL] manage_schedule completed in <200ms
[PERF] Tool call ended: manage_schedule, elapsed: ~300ms
[PERF] First token: <2000ms, total: <2500ms, tools called: 1
[PERF] Total completed: <3500ms, tool calls: 1
```

关键指标：
- **工具调用次数**: 1次（不是多次）
- **单次工具耗时**: <200ms
- **总耗时**: <3500ms

## 下一步行动

1. ✅ 精简Prompt，强调直接create
2. ⏳ 重启服务，测试新Prompt效果
3. ⏳ 如果还是慢，测试方案3（切换模型）
4. ⏳ 如果仍慢，临时禁用冲突检测测试

---

**现在请重启服务，测试同样的请求，查看日志输出！**
