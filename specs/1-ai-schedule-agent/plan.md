---
name: AI智能排班助手实现计划
overview: 基于LangChain构建AI智能排班助手，支持多轮对话、工具调用和30天跨会话记忆，能够智能解析自然语言排班请求，自动检测冲突并创建排班记录。支持VIP客户优先插入功能，可自动顺延受影响排班。使用SSE实现实时流式对话。
status: Phase 2 完成，准备进入实现阶段
todos: []
---

# AI智能排班助手实现计划

## Technical Context

### 现有技术栈
- **后端框架**: Node.js + Express.js
- **数据库**: MySQL (mysql2连接池)
- **认证**: JWT (jsonwebtoken)
- **现有表结构**:
  - `schedule`: 排班表（id, project, doctor_id, nurse_id, customer_id, room, start_time, duration, end_time, remark）
  - `user`: 用户表（医生、护士信息）
  - `customer`: 客户表

### 新增技术栈
- **AI框架**: LangChain.js (Node.js版本)
- **AI模型**: 
  - OpenAI GPT (GPT-4/GPT-3.5) - 通过 @langchain/openai
  - DeepSeek - 通过自定义适配器或 @langchain/deepseek（如果可用）
- **自然语言处理**: 
  - 中文NER和时间解析（可能需要中文NLP库或依赖AI模型能力）
  - 时间表达式解析（"今天"、"明天"、"下午2点"等）
- **工具调用**: LangChain Tools/Agents
- **记忆管理**: 
  - 短期记忆：LangChain Memory（ConversationBufferMemory）
  - 长期记忆：MySQL数据库存储（30天跨会话持久化）
- **对话接口**: Server-Sent Events (SSE) 实现流式响应，客户端通过 HTTP POST 发送消息

### 依赖关系
- 依赖现有排班管理API (`/api/schedule/*`)
- 依赖用户查询API (`/api/user/list`)
- 依赖客户查询API (`/api/customer/list`)
- 需要新增对话记忆表 (`conversation_memory`)

### 技术决策点（需要研究）
1. **LangChain.js vs LangChain Python**: 选择Node.js版本以保持技术栈一致性
2. **DeepSeek集成方式**: 需要确认DeepSeek是否有官方LangChain适配器，或需要自定义适配器
3. **中文时间解析**: 是否需要独立的中文NLP库，还是依赖AI模型的NER能力
4. **记忆存储结构**: 如何设计MySQL表结构以支持30天跨会话记忆和快速检索
5. **SSE 实现细节**: Server-Sent Events 流式响应实现方案
6. **工具调用实现**: 如何将现有API封装为LangChain Tools
7. **项目类型与默认时长映射**: 配置存储方式（数据库表 vs 配置文件）

### 未知技术细节
- ✅ **已解决**: DeepSeek API的LangChain集成方式 → 自定义LLM适配器（参见research.md R2）
- ✅ **已解决**: 中文时间表达式解析的最佳实践 → AI模型+自定义解析器（参见research.md R3）
- ✅ **已解决**: LangChain Memory与MySQL持久化的集成模式 → MySQL表存储+BufferMemory（参见research.md R4）
- ✅ **已解决**: 工具调用的错误处理和重试机制 → 在工具封装层实现重试机制（参见research.md R1）
- ✅ **已解决**: AI模型响应时间优化策略 → 流式响应+提示词优化（参见research.md R5）
- ✅ **已解决**: VIP优先插入的批量时间顺延算法 → 数据库事务+按时间顺序批量更新（参见research.md R6）

## Constitution Check

### 代码质量
- ✅ 遵循现有代码风格（Express.js路由模式）
- ✅ 错误处理：统一错误响应格式
- ✅ 日志记录：关键操作记录日志
- ✅ 类型安全：使用JSDoc或TypeScript（如前端）

### 安全性
- ✅ 认证授权：对话接口需要JWT认证
- ✅ SQL注入防护：使用参数化查询
- ✅ 输入验证：验证用户输入的自然语言内容
- ✅ API限流：防止AI接口滥用

### 性能
- ✅ 响应时间：AI响应在3秒内（需要优化）
- ✅ 数据库查询优化：索引、连接池
- ✅ 记忆检索优化：30天数据的高效查询

### 可维护性
- ✅ 模块化设计：AI Agent、工具、记忆管理分离
- ✅ 配置管理：AI模型配置可切换（OpenAI/DeepSeek）
- ✅ 错误处理：清晰的错误信息和日志

## Phase 0: Research

### Research Tasks

#### R1: LangChain.js 工具调用和Agent实现
**目标**: 了解如何在Node.js中使用LangChain实现工具调用和Agent
**研究内容**:
- LangChain.js的Agent类型（ReAct、Plan-and-Execute等）
- Tool定义和注册方式
- 如何将现有API封装为LangChain Tools
- Agent与Memory的集成

**输出**: `research.md` - LangChain.js工具调用实现方案

#### R2: DeepSeek API集成方案
**目标**: 确认DeepSeek模型如何集成到LangChain
**研究内容**:
- DeepSeek API接口规范
- LangChain是否有官方DeepSeek适配器
- 如果没有，如何创建自定义LLM适配器
- API密钥管理和配置

**输出**: `research.md` - DeepSeek集成方案

#### R3: 中文时间表达式解析
**目标**: 确定中文时间解析的实现方式
**研究内容**:
- 中文时间表达式的常见模式（"今天"、"明天"、"下午2点"等）
- 是否需要独立的中文NLP库（如jieba、paddlepaddle）
- AI模型的NER能力是否足够
- 相对时间到绝对时间的转换逻辑

**输出**: `research.md` - 中文时间解析实现方案

#### R4: 跨会话记忆存储设计
**目标**: 设计MySQL表结构支持30天跨会话记忆
**研究内容**:
- 对话记忆的数据模型（会话ID、消息、上下文、时间戳）
- 如何高效存储和检索30天内的对话历史
- 记忆压缩和摘要策略（避免存储过多冗余信息）
- 自动清理过期记忆的机制

**输出**: `research.md` - 记忆存储设计方案

#### R5: SSE实时对话实现
**目标**: 确定SSE流式响应的实现方案
**研究内容**:
- Server-Sent Events (SSE) 在Express.js中的实现
- SSE连接管理和错误处理
- 与LangChain Agent的异步交互和流式输出
- 前端SSE客户端实现（EventSource API）
- SSE与HTTP POST的配合使用（POST发送消息，SSE接收响应）

**输出**: `research.md` - SSE实时对话实现方案

#### R6: VIP优先插入的批量时间顺延算法
**目标**: 设计VIP优先插入后的批量时间顺延算法
**研究内容**:
- 受影响排班的查询策略（同一诊室、同一医生）
- 数据库事务处理确保原子性
- 批量更新的性能优化
- 并发控制和锁机制
- 去重处理（避免重复顺延）

**输出**: `research.md` - VIP优先插入批量顺延算法方案

### Research Output: research.md

✅ **已完成** - 参见 `research.md` 文件，包含以下研究结果：
- R1: LangChain.js 工具调用和Agent实现方案
- R2: DeepSeek API集成方案（自定义适配器）
- R3: 中文时间表达式解析方案（AI模型+自定义解析器）
- R4: 跨会话记忆存储设计方案（MySQL表结构）
- R5: SSE实时对话实现方案（HTTP POST + SSE流式响应）
- R6: VIP优先插入的批量时间顺延算法（数据库事务+按时间顺序批量更新）

## Phase 1: Design & Contracts

### Data Model

#### 新增数据库表

**conversation_memory**
```sql
CREATE TABLE `conversation_memory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) NOT NULL COMMENT '会话ID',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID（可选，用于多用户场景）',
  `role` enum('user','assistant') NOT NULL COMMENT '消息角色',
  `content` text NOT NULL COMMENT '消息内容',
  `metadata` json DEFAULT NULL COMMENT '元数据（提取的信息、工具调用等）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话记忆表';
```

**project_duration_config**
```sql
CREATE TABLE `project_duration_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project` varchar(50) NOT NULL COMMENT '项目类型',
  `default_duration` int(11) NOT NULL COMMENT '默认时长（分钟）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project` (`project`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目类型默认时长配置表';
```

#### 数据实体

**ConversationSession**
- `session_id`: string (UUID)
- `user_id`: number (optional)
- `created_at`: datetime
- `last_active_at`: datetime
- `extracted_info`: object (已提取的排班信息)

**ConversationMessage**
- `id`: number
- `session_id`: string
- `role`: 'user' | 'assistant'
- `content`: string
- `metadata`: object (工具调用结果、提取的信息等)
- `created_at`: datetime

**ScheduleQueryInfo** (从对话中提取)
- `date`: string (日期，可能为相对时间)
- `doctor_name`: string
- `nurse_name`: string (optional)
- `customer_name`: string
- `project`: string
- `start_time`: string (可能为相对时间)
- `duration`: number (分钟)
- `buffer_time`: number (分钟，optional)
- `room`: string (optional)

### API Contracts

#### POST /api/ai-schedule/chat
**描述**: 发送消息到AI助手，通过SSE流式返回响应

**实现方式**: 
- 客户端通过HTTP POST发送消息
- 服务器返回SSE流式响应（Content-Type: text/event-stream）
- 响应以流式方式逐步推送AI生成的内容

**Request**:
```json
{
  "session_id": "string (optional, 新会话时为空)",
  "message": "string (用户输入的自然语言)",
  "user_id": "number (optional)"
}
```

**Response (SSE流式格式)**:
```
Content-Type: text/event-stream

data: {"type":"chunk","content":"部分响应文本"}

data: {"type":"chunk","content":"更多响应文本"}

data: {"type":"complete","data":{"session_id":"string","response":"完整AI回复","extracted_info":{...},"has_conflict":false,"conflict_details":[],"suggested_schedule":{...},"requires_confirmation":false}}

```

**SSE事件类型**:
- `chunk`: 流式文本片段（AI逐token生成）
- `complete`: 完整响应（包含所有结构化信息）

#### POST /api/ai-schedule/confirm
**描述**: 确认创建排班记录

**Request**:
```json
{
  "session_id": "string",
  "suggested_schedule": {
    "project": "string",
    "doctor_id": 1,
    "nurse_id": 2,
    "customer_id": 3,
    "room": "诊室1",
    "start_time": "2025-01-28 14:00:00",
    "duration": 30,
    "remark": "string (optional)"
  },
  "is_vip_priority": false
}
```

**Response**:
```json
{
  "code": 0,
  "message": "排班创建成功",
  "re": {
    "schedule_id": 123
  }
}
```

#### POST /api/ai-schedule/vip-insert
**描述**: VIP优先插入排班并顺延受影响排班

**Request**:
```json
{
  "session_id": "string",
  "vip_schedule": {
    "project": "string",
    "doctor_id": 1,
    "nurse_id": 2,
    "customer_id": 3,
    "room": "诊室1",
    "start_time": "2025-01-28 14:00:00",
    "duration": 70,
    "remark": "string (optional)"
  }
}
```

**Response**:
```json
{
  "code": 0,
  "message": "VIP排班创建成功，已顺延受影响排班",
  "re": {
    "vip_schedule_id": 123,
    "affected_schedules": [
      {
        "schedule_id": 456,
        "original_start_time": "2025-01-28 14:30:00",
        "new_start_time": "2025-01-28 15:40:00",
        "original_end_time": "2025-01-28 15:00:00",
        "new_end_time": "2025-01-28 16:10:00"
      }
    ],
    "delay_duration": 70,
    "affected_count": 5
  }
}
```

#### GET /api/ai-schedule/history/:session_id
**描述**: 获取会话历史记录

**Response**:
```json
{
  "code": 0,
  "message": "success",
  "re": {
    "session_id": "string",
    "messages": [
      {
        "role": "user",
        "content": "今天王医生要在13点给李XX拔牙",
        "created_at": "2025-01-27 10:00:00"
      },
      {
        "role": "assistant",
        "content": "已为您查询到...",
        "created_at": "2025-01-27 10:00:01"
      }
    ]
  }
}
```

#### DELETE /api/ai-schedule/session/:session_id
**描述**: 删除会话（清理记忆）

**Response**:
```json
{
  "code": 0,
  "message": "会话已删除"
}
```

### Agent Context

**工具定义** (LangChain Tools)

1. **queryScheduleTool**: 查询排班情况
   - 输入: date, doctor_id, nurse_id, room
   - 输出: 排班列表

2. **checkConflictTool**: 检查时间冲突
   - 输入: doctor_id, nurse_id, room, start_time, duration
   - 输出: 冲突检测结果

3. **queryAvailableResourcesTool**: 查询空闲资源
   - 输入: date, time_range, resource_type (doctor/nurse/room)
   - 输出: 空闲资源列表

4. **createScheduleTool**: 创建排班记录
   - 输入: schedule数据
   - 输出: 创建结果

5. **queryUserTool**: 查询用户信息（医生/护士）
   - 输入: name, role
   - 输出: 用户信息

6. **queryCustomerTool**: 查询客户信息
   - 输入: name
   - 输出: 客户信息

7. **getProjectDurationTool**: 获取项目默认时长
   - 输入: project
   - 输出: 默认时长（分钟）

8. **vipPriorityInsertTool**: VIP优先插入排班
   - 输入: schedule数据, is_vip_priority=true
   - 输出: VIP插入结果和受影响排班列表

9. **delaySchedulesTool**: 顺延受影响排班
   - 输入: affected_schedule_ids, delay_duration
   - 输出: 顺延调整结果

### Quickstart Guide

✅ **已完成** - 参见 `quickstart.md` 文件，包含：
- 安装步骤
- 配置说明
- 使用示例
- 故障排查指南

## Phase 2: Implementation Planning

### 实现阶段划分

#### Stage 1: 基础架构搭建
1. 安装依赖（LangChain.js等，不需要Socket.io，使用SSE）
2. 创建数据库表（conversation_memory、project_duration_config）
3. 初始化项目结构（ai-schedule目录）
4. 配置AI模型（OpenAI/DeepSeek配置管理）

#### Stage 2: 工具封装
1. 封装现有API为LangChain Tools
2. 实现空闲资源查询工具（医生、诊室，不包括护士）
3. 实现冲突检测工具（按项目类型判断是否需要冲突检测）
4. 实现VIP优先插入工具（vipPriorityInsertTool）
5. 实现批量顺延工具（delaySchedulesTool）
6. 工具错误处理和重试机制

#### Stage 3: AI Agent实现
1. 配置LangChain Agent（ReAct Agent）
2. 集成工具到Agent
3. 实现自然语言理解（信息提取）：
   - 提取必填字段（项目类型、医生、客户、开始时间）
   - 提取可选字段（护士、诊室、时长、备注）
   - 识别VIP优先标识
4. 实现自动资源分配逻辑（不包括护士）
5. 实现项目类型判断逻辑（是否需要冲突检测）

#### Stage 4: 记忆管理
1. 实现短期记忆（ConversationBufferMemory）
2. 实现长期记忆（MySQL存储和检索）
3. 实现30天记忆清理机制
4. 记忆压缩和摘要（可选优化）

#### Stage 5: 对话接口（SSE实现）
1. 实现SSE流式响应接口（/api/ai-schedule/chat）
   - 使用Express.js的SSE支持（设置Content-Type: text/event-stream）
   - 实现流式数据推送（data: {json}\n\n格式）
2. 客户端通过HTTP POST发送消息到同一接口
3. 服务器通过SSE流式推送AI响应（逐token或逐chunk推送）
4. SSE连接管理：
   - 连接建立和保持
   - 心跳机制（保持连接活跃）
   - 错误处理和自动重连
   - 连接超时处理
5. 会话管理（创建、查询、删除）
6. 错误处理和超时处理

#### Stage 6: VIP优先插入功能
1. 实现VIP优先标识识别（自然语言理解）
2. 实现VIP优先冲突检测逻辑
3. 实现受影响排班查询（同一诊室、同一医生）
4. 实现批量时间顺延算法（事务处理）
5. 实现VIP优先插入API接口
6. 实现顺延调整结果返回

#### Stage 7: 功能验证和性能测试
1. 集成测试（端到端对话流程、VIP优先插入流程）
2. 性能测试（响应时间、并发、批量顺延性能）
3. 边界情况测试（冲突检测、资源不足、VIP优先边界情况）

### 文件结构

```
serve/
├── ai-schedule/
│   ├── agent/
│   │   ├── index.js              # Agent主入口
│   │   ├── config.js             # Agent配置（模型选择等）
│   │   └── prompt.js             # Agent提示词模板
│   ├── tools/
│   │   ├── index.js              # 工具注册
│   │   ├── schedule-tools.js     # 排班相关工具
│   │   ├── resource-tools.js     # 资源查询工具
│   │   └── user-tools.js         # 用户/客户查询工具
│   ├── memory/
│   │   ├── short-term.js         # 短期记忆（LangChain Memory）
│   │   ├── long-term.js          # 长期记忆（MySQL）
│   │   └── manager.js            # 记忆管理器
│   ├── parsers/
│   │   ├── time-parser.js        # 时间表达式解析
│   │   └── info-extractor.js     # 信息提取（NER）
│   ├── handlers/
│   │   ├── chat-handler.js       # 对话处理
│   │   └── session-handler.js    # 会话管理
│   └── utils/
│       ├── conflict-checker.js   # 冲突检测逻辑
│       ├── resource-allocator.js # 资源分配逻辑
│       └── vip-priority-handler.js # VIP优先插入和顺延处理
├── router/
│   └── ai-schedule.js            # 路由定义
└── router_handler/
    └── ai-schedule.js            # 路由处理器
```

### 关键实现细节

#### 1. Agent配置
- 使用ReAct Agent（适合工具调用场景）
- 支持OpenAI和DeepSeek模型切换
- 配置温度参数（temperature）控制创造性
- 设置最大token限制

#### 2. 信息提取策略
- 使用AI模型的NER能力提取实体（医生、护士、客户、项目）
- 使用自定义时间解析器处理中文时间表达式
- 识别VIP优先标识（"XX客户插队"、"XX客户优先"）
- 识别备注信息（用户提供的备注文本）
- 将提取的信息结构化存储到metadata（包括remark和is_vip_priority字段）

#### 3. 自动资源分配
- 当缺少时间时：查询最早可用时间段
- 当缺少医生时：查询空闲医生，选择工作负载最低的
- 当缺少护士时：不自动分配（护士为机动资源，用户指定时使用）
- 当缺少诊室时：查询空闲诊室，选择使用频率最低的
- 当缺少时长时：从project_duration_config表查询默认时长（椅旁项目不需要时长）
- 备注字段：如果用户在对话中提供备注，提取并保存到remark字段

#### 4. 冲突检测
- 复用现有schedule.js中的冲突检测逻辑
- 考虑缓冲时间（duration + buffer_time）
- 返回详细的冲突信息（类型、时间段、冲突记录）
- 支持VIP优先插入的特殊冲突检测（检测冲突但允许插入）

#### 5. VIP优先插入和时间顺延
- 识别VIP优先标识（"XX客户插队"、"XX客户优先"）
- 仅适用于需要冲突判断的项目类型（备牙、戴牙、复诊、蜡形试戴）
- 查询受影响排班：
  - 同一诊室、同一日期、插入时间之后的所有排班
  - 同一医生、同一日期、插入时间之后的所有排班
- 批量顺延算法：
  - 按VIP插入的时长顺延（开始时间往后推VIP插入的时长）
  - 保持每个排班的原时长不变
  - 使用数据库事务确保原子性
  - 按时间顺序处理，避免重复顺延
- 返回顺延调整摘要

#### 6. 记忆检索优化
- 使用session_id索引快速查询会话历史
- 限制每次检索的消息数量（避免token超限）
- 实现记忆摘要（将旧消息压缩为摘要）

### 风险与缓解

1. **AI响应时间超3秒**
   - 缓解：优化提示词长度、使用流式响应、缓存常见查询

2. **中文时间解析不准确**
   - 缓解：建立时间表达式模式库、使用AI模型辅助解析

3. **工具调用失败**
   - 缓解：实现重试机制、错误降级（返回友好错误信息）

4. **记忆存储过大**
   - 缓解：实现记忆压缩、定期清理、限制单会话消息数

5. **并发对话性能**
   - 缓解：使用连接池、异步处理、考虑消息队列

6. **VIP优先插入的批量顺延性能**
   - 缓解：使用数据库事务、批量更新、索引优化、限制单次顺延数量

## Phase 2 实现计划状态

✅ **Phase 0: Research** - 已完成
- 所有6个研究任务已完成
- research.md 已生成并包含所有技术决策

✅ **Phase 1: Design & Contracts** - 已完成
- data-model.md 已生成
- contracts/api.yaml 已生成（OpenAPI规范）
- quickstart.md 已生成

✅ **Phase 2: Implementation Planning** - 已完成
- 实现阶段划分（7个阶段）
- 文件结构定义
- 关键实现细节说明
- 风险与缓解策略

## 下一步行动

1. ✅ Phase 0 研究任务已完成
2. ✅ Phase 1 设计文档已完成
3. ✅ Phase 2 实现计划已完成
4. **下一步**: 创建实现任务清单（使用 `/speckit.tasks`）
5. **或**: 开始 Stage 1 实现（基础架构搭建）
