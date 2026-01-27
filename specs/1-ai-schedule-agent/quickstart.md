# AI智能排班助手快速开始指南

## 前置要求

- Node.js >= 16.0.0
- MySQL >= 5.7
- OpenAI API Key 或 DeepSeek API Key

## 安装步骤

### 1. 安装依赖

```bash
cd serve
npm install langchain @langchain/openai @langchain/core dayjs uuid
```

### 2. 配置环境变量

创建 `.env` 文件（或添加到现有配置）：

```bash
# AI模型配置
AI_MODEL_TYPE=openai  # 或 "deepseek"
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=...

# 数据库配置（如果尚未配置）
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=process
```

### 3. 初始化数据库

执行 SQL 脚本创建新表：

```bash
# 创建对话记忆表
mysql -u root -p process < web/mysql/conversation_memory.sql

# 创建项目时长配置表
mysql -u root -p process < web/mysql/project_duration_config.sql

# 插入初始配置数据
mysql -u root -p process < web/mysql/project_duration_config_data.sql
```

### 4. 创建项目结构

```bash
cd serve
mkdir -p ai-schedule/{agent,tools,memory,parsers,handlers,utils}
```

### 5. 启动服务

```bash
npm start
```

## 使用示例

### 前端调用示例

```javascript
// 发送消息到AI助手
const response = await fetch('/api/ai-schedule/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    session_id: sessionId || '',  // 新会话时为空
    message: '今天王医生、李护士要在13点给李XX拔牙，拔牙时间预计是30分钟',
    user_id: 1  // 可选
  })
});

const data = await response.json();
console.log(data.re.response);  // AI回复
console.log(data.re.extracted_info);  // 提取的信息
console.log(data.re.has_conflict);  // 是否有冲突
console.log(data.re.suggested_schedule);  // 建议的排班方案

// 确认创建排班
if (data.re.requires_confirmation && data.re.suggested_schedule) {
  const confirmResponse = await fetch('/api/ai-schedule/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      session_id: data.re.session_id,
      suggested_schedule: data.re.suggested_schedule
    })
  });
}
```

### 多轮对话示例

```javascript
let sessionId = '';

// 第一轮：用户提供部分信息
const response1 = await fetch('/api/ai-schedule/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '明天下午给张医生安排一个拔牙'
  })
});
const data1 = await response1.json();
sessionId = data1.re.session_id;  // 保存会话ID

// 第二轮：AI询问缺失信息
// data1.re.response: "患者姓名是什么？"

// 第三轮：用户补充信息
const response2 = await fetch('/api/ai-schedule/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: sessionId,
    message: '患者是李XX'
  })
});
const data2 = await response2.json();

// AI自动分配资源并展示方案
// data2.re.suggested_schedule: { ... }
```

## 核心功能说明

### 1. 自然语言理解
- 识别日期、医生、护士、项目、客户、时间、时长等信息
- 支持相对时间（"今天"、"明天"、"下午2点"）
- 支持模糊时间（"下午"、"晚上"）

### 2. 自动资源分配
当缺少以下信息时，系统自动计算并分配：
- **时间**: 查询最早可用时间段
- **医生**: 查询空闲医生，选择工作负载最低的
- **护士**: 查询空闲护士，选择工作负载最低的
- **诊室**: 查询空闲诊室，选择使用频率最低的
- **时长**: 根据项目类型查询默认时长

### 3. 冲突检测
- 检测医生、护士、诊室的时间冲突
- 考虑缓冲时间（duration + buffer_time）
- 返回详细的冲突信息

### 4. 记忆管理
- 短期记忆：当前会话的上下文（LangChain Memory）
- 长期记忆：30天跨会话记忆（MySQL存储）
- 自动清理：30天后的记录自动删除

## 配置说明

### AI模型切换

在 `.env` 中设置 `AI_MODEL_TYPE`:
- `openai`: 使用 OpenAI GPT 模型
- `deepseek`: 使用 DeepSeek 模型

### 项目类型默认时长配置

在 `project_duration_config` 表中管理：

```sql
-- 查看当前配置
SELECT * FROM project_duration_config;

-- 添加新项目类型
INSERT INTO project_duration_config (project, default_duration) 
VALUES ('新项目', 25);

-- 修改默认时长
UPDATE project_duration_config 
SET default_duration = 35 
WHERE project = '拔牙';
```

## 故障排查

### 1. AI响应超时
- 检查 API Key 是否正确
- 检查网络连接
- 考虑使用流式响应（streaming）

### 2. 时间解析不准确
- 检查 `dayjs` 是否正确安装
- 查看 `parsers/time-parser.js` 中的时间模式库
- 检查 AI 模型提取的时间文本

### 3. 记忆检索失败
- 检查数据库连接
- 确认 `conversation_memory` 表已创建
- 检查索引是否正确创建

### 4. 工具调用失败
- 检查现有 API 是否正常（`/api/schedule/*`, `/api/user/*`, `/api/customer/*`）
- 查看工具封装代码中的错误处理
- 检查 Agent 的提示词配置

## 下一步

- 查看 [plan.md](./plan.md) 了解完整实现计划
- 查看 [data-model.md](./data-model.md) 了解数据模型
- 查看 [contracts/api.yaml](./contracts/api.yaml) 了解 API 规范
