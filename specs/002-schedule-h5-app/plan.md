# Implementation Plan: 智能排班助手H5前端应用 - React技术栈迁移

**Branch**: `002-schedule-h5-app` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: 将现有的 uni-app (Vue3) 移动端H5应用迁移到 React 技术栈

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

将智能排班助手H5前端应用从 uni-app (Vue3) 技术栈迁移到 React 技术栈，保持移动端H5的特性。应用包含两个主要页面：智能对话AI页面和日历日程页面，通过底部Tab导航切换。需要保持现有功能完整性，包括SSE流式响应、状态管理、API集成等。

## Technical Context

**Language/Version**: TypeScript 5.2+ / JavaScript ES2020+  
**Primary Dependencies**: React 18+, React Router 6+, Zustand/Redux Toolkit (状态管理), Vite 5+, Axios/Fetch API  
**Storage**: LocalStorage (会话管理), 后端API (排班数据)  
**Testing**: Vitest + React Testing Library (单元测试), Playwright (E2E测试)  
**Target Platform**: 移动端H5浏览器 (iOS Safari, Android Chrome), 屏幕宽度 320px-768px  
**Project Type**: web (移动端H5单页应用)  
**Performance Goals**: 
- 页面加载时间 < 3秒
- AI响应首字延迟 < 1秒
- 页面切换时间 < 5秒
- 滚动帧率 ≥ 30fps
**Constraints**: 
- 移动端优先设计，响应式布局
- 支持SSE流式响应
- 离线状态处理
- 网络错误重试机制
- 横竖屏适配
**Scale/Scope**: 
- 2个主要页面 (对话页、日程页)
- 3个组件 (消息组件、排班项组件、日历组件)
- 2个Store (聊天Store、排班Store)
- API集成 (SSE聊天、排班查询、排班创建)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS

**Checks**:
- ✅ 技术栈选择合理：React 是成熟的移动端H5开发框架
- ✅ 项目结构清晰：单页应用结构，组件化开发
- ✅ 性能目标明确：符合移动端H5应用标准
- ✅ 无过度设计：使用标准React生态工具，避免引入不必要的复杂性

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
schedule-h5-react/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── ChatMessage/     # 聊天消息组件
│   │   ├── ScheduleItem/    # 排班项组件
│   │   ├── Calendar/        # 日历组件
│   │   └── TabBar/          # 底部Tab导航组件
│   ├── pages/               # 页面组件
│   │   ├── Chat/            # 智能对话页面
│   │   └── Schedule/        # 日历日程页面
│   │       └── Detail/      # 日程详情页面
│   ├── stores/              # 状态管理
│   │   ├── chatStore.ts     # 聊天状态
│   │   └── scheduleStore.ts # 排班状态
│   ├── services/            # API服务
│   │   ├── aiSchedule.ts    # AI排班API
│   │   └── schedule.ts      # 排班API
│   ├── utils/               # 工具函数
│   │   ├── request.ts       # HTTP请求封装
│   │   └── sse.ts           # SSE流式响应处理
│   ├── hooks/                # 自定义Hooks
│   │   ├── useSSE.ts        # SSE Hook
│   │   └── useScroll.ts     # 滚动处理Hook
│   ├── types/               # TypeScript类型定义
│   │   ├── chat.ts
│   │   └── schedule.ts
│   ├── styles/              # 全局样式
│   │   ├── variables.scss   # 变量
│   │   └── mixins.scss      # Mixins
│   ├── App.tsx              # 根组件
│   └── main.tsx             # 入口文件
├── public/                  # 静态资源
│   ├── tab-chat.png
│   ├── tab-chat-active.png
│   ├── tab-schedule.png
│   └── tab-schedule-active.png
├── tests/                   # 测试文件
│   ├── components/
│   ├── pages/
│   └── utils/
├── vite.config.ts           # Vite配置
├── tsconfig.json            # TypeScript配置
├── package.json
└── index.html
```

**Structure Decision**: 采用标准React单页应用结构，组件化开发。使用Vite作为构建工具，TypeScript提供类型安全。状态管理使用Zustand（轻量级）或Redux Toolkit。样式使用SCSS，保持与现有uni-app项目的样式变量一致。

## Phase 0: Research Complete ✅

**Output**: `research.md` - 所有技术选型已完成研究并确定：
- React 18 + TypeScript 作为核心框架
- Zustand 用于状态管理
- React Router v6 用于路由
- 原生Fetch API实现SSE流式响应
- 自研日历组件（基于dayjs）
- Vite作为构建工具
- SCSS + CSS Modules用于样式
- Vitest + React Testing Library + Playwright用于测试

**Status**: ✅ 所有技术选型已确定，无需要进一步澄清的问题

---

## Phase 1: Design Complete ✅

**Outputs**:
1. `data-model.md` - 完整的数据模型定义，包含10个实体和2个Store状态模型
2. `contracts/api.yaml` - OpenAPI 3.0规范的API接口定义（已存在）
3. `quickstart.md` - 详细的开发指南，包含项目初始化、核心功能实现、代码示例

**Key Design Decisions**:
- 使用Zustand进行状态管理，支持持久化
- SSE流式响应使用原生Fetch API + AsyncGenerator
- 移动端适配使用rem单位 + Viewport meta标签
- 组件化设计，可复用组件独立封装

**Status**: ✅ 设计阶段完成，可以开始实施

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无违反Constitution的情况，所有技术选型都符合项目需求且保持简洁。
