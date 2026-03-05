# 智能排班助手H5前端应用 - React版本

## 项目简介

智能排班助手H5前端应用，使用 React + TypeScript + Vite 构建的移动端H5应用。支持通过自然语言与AI对话进行排班查询、冲突检测和排班创建。

## 技术栈

- React 18+
- TypeScript 5.2+
- Vite 5+
- React Router v6
- Zustand (状态管理)
- Day.js (日期处理)
- Axios (HTTP请求)
- Less (样式)

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+ 或 yarn 1.22+

### 安装依赖

```bash
cd schedule-h5-react
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:8080 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
schedule-h5-react/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Calendar/        # 日历组件
│   │   ├── ChatMessage/     # 聊天消息组件
│   │   ├── EmptyState/      # 空状态组件
│   │   ├── ErrorBoundary/   # 错误边界组件
│   │   ├── Loading/         # 加载组件
│   │   ├── ScheduleItem/    # 排班项组件
│   │   └── TabBar/          # 底部Tab导航
│   ├── pages/               # 页面组件
│   │   ├── Chat/            # 智能对话页面
│   │   └── Schedule/        # 日历日程页面
│   │       └── Detail/      # 日程详情页面
│   ├── stores/              # Zustand状态管理
│   │   ├── chatStore.ts     # 聊天状态
│   │   └── scheduleStore.ts # 排班状态
│   ├── services/            # API服务
│   │   ├── aiSchedule.ts    # AI排班API
│   │   └── schedule.ts      # 排班API
│   ├── utils/               # 工具函数
│   │   ├── request.ts       # HTTP请求封装
│   │   └── sse.ts           # SSE流式响应处理
│   ├── hooks/               # 自定义Hooks
│   │   ├── useOnline.ts     # 网络状态检测
│   │   ├── usePerformance.ts # 性能监控
│   │   ├── useScroll.ts     # 滚动处理
│   │   └── useSSE.ts        # SSE Hook
│   ├── types/               # TypeScript类型定义
│   └── styles/              # 全局样式
├── public/                  # 静态资源
└── dist/                    # 构建输出
```

## 功能特性

### 智能对话AI页面

- SSE流式响应，实时显示AI回复
- 支持自然语言排班查询和创建
- VIP优先插入确认
- 对话历史持久化

### 日历日程页面

- 日历视图，显示有排班的日期标记
- 按医生、诊室筛选排班
- 日程详情页，按时间段分组显示
- 下拉刷新

### 底部Tab导航

- 对话和日程页面切换
- 保持页面状态和滚动位置

### 通用功能

- 离线状态检测和提示
- 错误边界处理
- 键盘可访问性支持
- 路由级代码分割
- 移动端优化（安全区域、禁止缩放）

## 开发说明

### 后端API配置

修改 `src/utils/request.ts` 中的 `BASE_URL`：

```typescript
const BASE_URL = 'http://localhost:3006'
```

### 移动端适配

- 设计稿宽度：375px
- 使用 rem 单位，根字体大小随屏幕宽度缩放
- 支持横竖屏切换
- 适配 iPhone X 等设备的安全区域

### 性能目标

- 页面加载时间 < 3秒
- AI响应首字延迟 < 1秒
- 页面切换时间 < 5秒
