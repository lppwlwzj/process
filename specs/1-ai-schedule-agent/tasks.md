# AI智能排班助手实现任务清单

## 概述

基于LangChain构建AI智能排班助手，支持多轮对话、工具调用和30天跨会话记忆，能够智能解析自然语言排班请求，自动检测冲突并创建排班记录。支持VIP客户优先插入功能，可自动顺延受影响排班。使用SSE实现实时流式对话。

## 用户故事映射

- **US1**: 查询排班可用性（场景1）
- **US2**: 自动创建排班（场景2）
- **US3**: 自动计算空闲资源（场景3）
- **US4**: 记忆上下文信息（场景4）
- **US5**: 直接插入排班（场景5）
- **US6**: VIP客户优先插入（场景6）

## 依赖关系

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3+ (User Stories)
                                                      ↓
                                              Phase Final (Polish)
```

用户故事依赖关系：
- US1, US2, US3, US5 可以并行开发（共享基础组件）
- US4 依赖 US1-US3（需要记忆管理）
- US6 依赖 US1-US3（需要冲突检测和排班创建）

## 并行执行示例

### US1-US3 可以并行
- US1: 查询排班可用性
- US2: 自动创建排班
- US3: 自动计算空闲资源

### US4 依赖 US1-US3
- US4: 记忆上下文信息（需要基础对话功能）

### US6 依赖 US1-US3
- US6: VIP客户优先插入（需要冲突检测和排班创建）

## 实现策略

**MVP范围**: Phase 1 + Phase 2 + US1 + US2（基础查询和创建功能）
**增量交付**: 每个用户故事都是独立可测试的功能模块

---

## Phase 1: 项目初始化

### 目标
搭建项目基础架构，安装依赖，创建数据库表。

### 独立测试标准
- 项目结构创建成功
- 依赖安装完成
- 数据库表创建成功
- 配置文件可读取

### 任务

- [x] T001 创建项目目录结构 serve/ai-schedule/ 及其子目录（agent/, tools/, memory/, parsers/, handlers/, utils/）
- [x] T001 创建项目目录结构 serve/ai-schedule/ 及其子目录（agent/, tools/, memory/, parsers/, handlers/, utils/）
- [x] T002 安装核心依赖包：langchain, @langchain/openai, @langchain/core 到 serve/package.json
- [x] T003 创建数据库表 conversation_memory（参考 data-model.md）到 web/mysql/conversation_memory.sql
- [x] T004 创建数据库表 project_duration_config（参考 data-model.md）到 web/mysql/project_duration_config.sql
- [x] T005 初始化项目配置文件 serve/ai-schedule/config.js（AI模型配置管理）
- [x] T006 创建环境变量配置示例文件 serve/.env.example（OPENAI_API_KEY, DEEPSEEK_API_KEY, AI_MODEL_TYPE）

---

## Phase 2: 基础组件

### 目标
实现基础工具类和工具函数，为所有用户故事提供支撑。

### 独立测试标准
- 时间解析器可以解析中文时间表达式
- 信息提取器可以提取排班相关信息
- 冲突检测工具可以检测时间冲突
- 资源分配工具可以查询空闲资源

### 任务

- [x] T007 [P] 实现时间表达式解析器 serve/ai-schedule/parsers/time-parser.js（支持"今天"、"明天"、"下午2点"等）
- [x] T008 [P] 实现信息提取器 serve/ai-schedule/parsers/info-extractor.js（提取医生、护士、客户、项目、时间、备注、VIP标识）
- [x] T009 [P] 实现冲突检测工具 serve/ai-schedule/utils/conflict-checker.js（按项目类型判断是否需要冲突检测）
- [x] T010 [P] 实现资源分配工具 serve/ai-schedule/utils/resource-allocator.js（查询空闲医生、诊室，不包括护士）
- [x] T011 [P] 实现项目类型判断工具 serve/ai-schedule/utils/project-type-checker.js（判断是否需要冲突检测）
- [x] T012 [P] 实现项目默认时长查询工具 serve/ai-schedule/utils/project-duration.js（从project_duration_config表查询）

---

## Phase 3: US1 - 查询排班可用性

### 目标
用户可以通过自然语言查询某个时间段是否可以安排诊疗，系统返回冲突分析结果。

### 独立测试标准
- 用户输入包含完整排班信息时，系统可以识别并查询
- 系统可以检测医生和诊室冲突（不包括护士）
- 系统返回详细的冲突信息或可用确认

### 任务

- [x] T013 [US1] 创建排班查询工具 serve/ai-schedule/tools/schedule-tools.js（queryScheduleTool）
- [x] T014 [US1] 创建冲突检测工具 serve/ai-schedule/tools/schedule-tools.js（checkConflictTool）
- [x] T015 [US1] 实现冲突分析报告生成 serve/ai-schedule/utils/conflict-checker.js（生成详细冲突信息）
- [x] T016 [US1] 集成查询和冲突检测工具到Agent serve/ai-schedule/agent/index.js

---

## Phase 4: US2 - 自动创建排班

### 目标
当排班无冲突时，系统建议并创建排班记录。

### 独立测试标准
- 系统检测到无冲突时，询问用户是否创建
- 用户确认后，系统成功创建排班记录
- 排班记录包含所有必要字段（项目、医生、客户、时间、时长、诊室、备注等）

### 任务

- [x] T017 [US2] 创建排班创建工具 serve/ai-schedule/tools/schedule-tools.js（createScheduleTool）
- [x] T018 [US2] 实现排班记录创建逻辑 serve/ai-schedule/utils/schedule-creator.js（包含必填字段验证）
- [x] T019 [US2] 实现确认流程处理 serve/ai-schedule/handlers/chat-handler.js（询问用户确认）
- [x] T020 [US2] 集成创建工具到Agent serve/ai-schedule/agent/index.js

---

## Phase 5: US3 - 自动计算空闲资源

### 目标
当用户输入信息不完整时，系统自动计算并分配空闲资源。

### 独立测试标准
- 系统可以识别缺失的字段（时间、诊室、时长）
- 系统可以自动查询并分配空闲资源
- 系统仅询问缺失的必填字段（客户、项目）
- 护士字段不自动分配

### 任务

- [x] T021 [US3] 创建空闲资源查询工具 serve/ai-schedule/tools/resource-tools.js（queryAvailableResourcesTool）
- [x] T022 [US3] 实现自动资源分配逻辑 serve/ai-schedule/utils/resource-allocator.js（自动分配时间、诊室、时长）
- [x] T023 [US3] 实现必填字段检查 serve/ai-schedule/utils/info-validator.js（检查项目、医生、客户、开始时间）
- [x] T024 [US3] 实现缺失字段询问逻辑 serve/ai-schedule/agent/prompt.js（仅询问必填字段）
- [x] T025 [US3] 集成资源分配工具到Agent serve/ai-schedule/agent/index.js

---

## Phase 6: US4 - 记忆上下文信息

### 目标
系统记住对话中的关键信息，支持多轮对话。

### 独立测试标准
- 系统可以记住对话中已提及的信息
- 系统可以在后续对话中引用之前的信息
- 系统支持30天跨会话记忆

### 任务

- [x] T026 [US4] 实现短期记忆管理 serve/ai-schedule/memory/short-term.js（ConversationBufferMemory）
- [x] T027 [US4] 实现长期记忆存储 serve/ai-schedule/memory/long-term.js（MySQL存储）
- [x] T028 [US4] 实现记忆管理器 serve/ai-schedule/memory/manager.js（统一管理短期和长期记忆）
- [x] T029 [US4] 实现记忆检索逻辑 serve/ai-schedule/memory/long-term.js（按session_id查询，限制数量）
- [x] T030 [US4] 实现30天记忆清理机制 serve/ai-schedule/memory/long-term.js（定时清理）
- [x] T031 [US4] 集成记忆管理到Agent serve/ai-schedule/agent/index.js

---

## Phase 7: US5 - 直接插入排班

### 目标
对于不需要冲突判断的项目类型，系统直接创建排班记录。

### 独立测试标准
- 系统可以识别不需要冲突判断的项目类型（面诊、雕蜡、椅旁）
- 系统检查必填字段完整性后直接创建
- 系统自动分配诊室和使用默认时长
- 系统保存备注信息

### 任务

- [x] T032 [US5] 实现项目类型判断逻辑 serve/ai-schedule/utils/project-type-checker.js（判断是否需要冲突检测）
- [x] T033 [US5] 实现直接插入流程 serve/ai-schedule/handlers/chat-handler.js（跳过冲突检测和确认）
- [x] T034 [US5] 实现备注字段提取和保存 serve/ai-schedule/parsers/info-extractor.js（提取备注信息）
- [x] T035 [US5] 集成直接插入逻辑到Agent serve/ai-schedule/agent/index.js

---

## Phase 8: US6 - VIP客户优先插入

### 目标
当用户明确说明VIP客户优先时，系统允许插入到冲突时间段并顺延其他排班。

### 独立测试标准
- 系统可以识别VIP优先标识（"XX客户插队"、"XX客户优先"）
- 系统可以查询受影响排班（同一诊室、同一医生）
- 系统可以批量顺延受影响排班
- 系统使用事务确保原子性

### 任务

- [x] T036 [US6] 实现VIP优先标识识别 serve/ai-schedule/parsers/info-extractor.js（识别"XX客户插队"、"XX客户优先"）
- [x] T037 [US6] 实现VIP优先冲突检测逻辑 serve/ai-schedule/utils/conflict-checker.js（检测冲突但允许插入）
- [x] T038 [US6] 实现受影响排班查询 serve/ai-schedule/utils/vip-priority-handler.js（查询同一诊室、同一医生）
- [x] T039 [US6] 实现批量时间顺延算法 serve/ai-schedule/utils/vip-priority-handler.js（事务处理，按时间顺序）
- [x] T040 [US6] 创建VIP优先插入工具 serve/ai-schedule/tools/schedule-tools.js（vipPriorityInsertTool）
- [x] T041 [US6] 创建批量顺延工具 serve/ai-schedule/tools/schedule-tools.js（delaySchedulesTool）
- [x] T042 [US6] 实现VIP优先插入API接口 serve/router_handler/ai-schedule.js（POST /api/ai-schedule/vip-insert）
- [x] T043 [US6] 集成VIP优先插入到Agent serve/ai-schedule/agent/index.js

---

## Phase 9: 对话接口（SSE实现）

### 目标
实现SSE流式响应接口，支持实时对话。

### 独立测试标准
- 客户端可以通过HTTP POST发送消息
- 服务器通过SSE流式推送AI响应
- 支持会话管理和自动重连

### 任务

- [x] T044 实现SSE流式响应接口 serve/router_handler/ai-schedule.js（POST /api/ai-schedule/chat）
- [x] T045 实现SSE连接管理 serve/router_handler/ai-schedule.js（心跳机制、错误处理、超时处理）
- [x] T046 实现会话管理 serve/ai-schedule/handlers/session-handler.js（创建、查询、删除会话）
- [x] T047 实现对话处理逻辑 serve/ai-schedule/handlers/chat-handler.js（集成Agent和记忆管理）
- [x] T048 实现会话历史查询接口 serve/router_handler/ai-schedule.js（GET /api/ai-schedule/history/:session_id）
- [x] T049 实现会话删除接口 serve/router_handler/ai-schedule.js（DELETE /api/ai-schedule/session/:session_id）
- [x] T050 实现确认创建排班接口 serve/router_handler/ai-schedule.js（POST /api/ai-schedule/confirm）
- [x] T051 配置路由 serve/router/ai-schedule.js（注册所有路由）

---

## Phase 10: Agent配置和集成

### 目标
配置LangChain Agent，集成所有工具和记忆管理。

### 独立测试标准
- Agent可以调用所有工具
- Agent可以理解自然语言并提取信息
- Agent可以自动分配资源
- Agent支持多轮对话

### 任务

- [x] T052 配置LangChain Agent serve/ai-schedule/agent/config.js（ReAct Agent，模型选择）
- [x] T053 创建Agent提示词模板 serve/ai-schedule/agent/prompt.js（包含工具描述和系统提示）
- [x] T054 实现Agent主入口 serve/ai-schedule/agent/index.js（集成所有工具和记忆）
- [x] T055 实现DeepSeek自定义适配器 serve/ai-schedule/agent/deepseek-adapter.js（参考research.md R2）
- [x] T056 实现工具错误处理和重试机制 serve/ai-schedule/tools/index.js（统一错误处理）

---

## Phase 11: 用户和客户查询工具

### 目标
实现用户（医生/护士）和客户信息查询工具。

### 独立测试标准
- 可以通过姓名查询医生信息
- 可以通过姓名查询客户信息
- 支持模糊匹配

### 任务

- [x] T057 [P] 创建用户查询工具 serve/ai-schedule/tools/user-tools.js（queryUserTool，查询医生/护士）
- [x] T058 [P] 创建客户查询工具 serve/ai-schedule/tools/user-tools.js（queryCustomerTool）
- [x] T059 [P] 实现姓名匹配逻辑 serve/ai-schedule/utils/name-matcher.js（支持模糊匹配）
- [x] T060 [P] 集成用户和客户查询工具到Agent serve/ai-schedule/agent/index.js

---

## Phase 12: 完善和优化

### 目标
完善功能，优化性能，处理边界情况。

### 独立测试标准
- 所有功能正常工作
- 响应时间在3秒内
- 错误处理完善
- 边界情况处理正确

### 任务

- [x] T061 实现工具调用重试机制 serve/ai-schedule/tools/index.js（失败重试3次）
- [ ] T062 实现记忆压缩和摘要 serve/ai-schedule/memory/long-term.js（可选优化）
- [x] T063 实现响应时间优化 serve/ai-schedule/agent/index.js（限制提示词长度，使用流式响应）
- [x] T064 实现错误处理和降级 serve/ai-schedule/handlers/chat-handler.js（友好错误信息）
- [x] T065 实现并发控制 serve/ai-schedule/utils/vip-priority-handler.js（VIP顺延的并发控制）
- [ ] T066 添加日志记录 serve/ai-schedule/utils/logger.js（关键操作记录日志）
- [ ] T067 实现API限流 serve/router_handler/ai-schedule.js（防止AI接口滥用）

---

## 任务统计

- **总任务数**: 67
- **Phase 1 (Setup)**: 6 个任务
- **Phase 2 (Foundational)**: 6 个任务
- **US1 (查询排班)**: 4 个任务
- **US2 (自动创建)**: 4 个任务
- **US3 (自动资源分配)**: 5 个任务
- **US4 (记忆管理)**: 6 个任务
- **US5 (直接插入)**: 4 个任务
- **US6 (VIP优先)**: 8 个任务
- **对话接口**: 8 个任务
- **Agent配置**: 5 个任务
- **用户/客户工具**: 4 个任务
- **完善优化**: 7 个任务

## MVP范围建议

**最小可行产品 (MVP)**:
- Phase 1: 项目初始化
- Phase 2: 基础组件
- US1: 查询排班可用性
- US2: 自动创建排班
- Phase 9: 对话接口（基础SSE）

**后续增量**:
- US3: 自动资源分配
- US4: 记忆管理
- US5: 直接插入
- US6: VIP优先插入

## 并行执行建议

以下任务可以并行执行（标记为 [P]）：
- T007-T012: 基础工具类（6个任务）
- T057-T059: 用户和客户查询工具（3个任务）

其他任务需要按顺序执行，因为存在依赖关系。
