# Research: React移动端H5技术栈迁移

**Date**: 2026-01-26  
**Feature**: 智能排班助手H5前端应用 - React技术栈迁移

## Research Tasks

### 1. React移动端H5开发框架选择

**Decision**: React 18+ with TypeScript

**Rationale**:
- React 18 提供稳定的并发特性，适合移动端性能优化
- TypeScript 提供类型安全，减少运行时错误
- 广泛的社区支持和丰富的生态

**Alternatives considered**:
- Next.js: 主要用于SSR场景，本项目为纯客户端SPA，不需要
- Remix: 同样偏重SSR，不适合纯H5应用

**References**:
- React 18 官方文档: https://react.dev
- React移动端最佳实践: https://reactnative.dev/docs/performance

---

### 2. 状态管理方案选择

**Decision**: Zustand

**Rationale**:
- 轻量级（<1KB），适合移动端H5应用
- API简洁，学习成本低
- 支持TypeScript，类型推断良好
- 无需Provider包裹，使用简单
- 性能优秀，按需更新

**Alternatives considered**:
- Redux Toolkit: 功能强大但体积较大，对于本项目可能过度设计
- Jotai: 原子化状态管理，但本项目状态结构相对简单，不需要原子化
- Context API: 原生方案但性能较差，不适合频繁更新的状态

**References**:
- Zustand文档: https://docs.pmnd.rs/zustand
- 状态管理对比: https://github.com/pmndrs/zustand#comparison

---

### 3. 路由方案选择

**Decision**: React Router v6

**Rationale**:
- React生态标准路由解决方案
- 支持嵌套路由，适合Tab导航场景
- 提供useNavigate、useParams等Hooks，API现代化
- 支持懒加载，优化首屏性能

**Alternatives considered**:
- Reach Router: 已合并到React Router
- Wouter: 轻量但功能较少，不适合复杂路由需求

**References**:
- React Router文档: https://reactrouter.com

---

### 4. SSE流式响应实现方案

**Decision**: 使用原生Fetch API + ReadableStream

**Rationale**:
- 现代浏览器原生支持，无需额外依赖
- 性能优秀，内存占用低
- 支持流式处理，适合AI响应场景
- 错误处理完善

**Alternatives considered**:
- EventSource API: 功能受限，不支持POST请求
- 第三方库（如eventsource-polyfill）: 增加依赖，本项目不需要polyfill

**Implementation Pattern**:
```typescript
async function* streamSSE(url: string, data: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6))
      }
    }
  }
}
```

**References**:
- Fetch API Streams: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
- SSE规范: https://html.spec.whatwg.org/multipage/server-sent-events.html

---

### 5. 移动端日历组件选择

**Decision**: 自研日历组件（基于dayjs）

**Rationale**:
- 现有uni-app项目使用uni-calendar，功能相对简单
- 自研可以完全控制样式和交互，符合移动端H5设计
- dayjs轻量级，适合移动端
- 可以复用现有业务逻辑（时间段分组、日期筛选等）

**Alternatives considered**:
- react-big-calendar: 功能强大但体积较大，主要用于桌面端
- react-calendar: 轻量但样式定制困难
- @mui/x-date-pickers: Material-UI生态，但体积较大

**Implementation Approach**:
- 使用dayjs处理日期计算
- 自定义日历UI组件，支持移动端触摸交互
- 支持日期选择、高亮显示有排班的日期

**References**:
- dayjs文档: https://day.js.org
- 移动端日历设计参考: Material Design Calendar Guidelines

---

### 6. 构建工具配置

**Decision**: Vite 5+

**Rationale**:
- 极速的HMR，提升开发体验
- 基于ESM的构建，性能优秀
- 配置简单，开箱即用
- 支持TypeScript、SCSS等，无需额外配置

**Configuration Highlights**:
- 移动端H5优化：代码分割、资源压缩
- 开发服务器配置：代理API请求
- 构建优化：Tree-shaking、压缩

**References**:
- Vite文档: https://vite.dev
- 移动端H5优化: https://vite.dev/guide/build.html#chunk-size-warning

---

### 7. 移动端适配方案

**Decision**: Viewport + rem + Flexbox/Grid

**Rationale**:
- Viewport meta标签设置移动端视口
- 使用rem单位，通过根字体大小适配不同屏幕
- Flexbox/Grid布局，响应式设计
- 媒体查询处理横竖屏切换

**Implementation**:
```scss
// 移动端适配
html {
  font-size: calc(100vw / 375 * 16); // 基于375px设计稿
}

@media (orientation: landscape) {
  html {
    font-size: calc(100vh / 667 * 16); // 横屏适配
  }
}
```

**Alternatives considered**:
- vw/vh单位: 在某些场景下可能出现滚动条问题
- 固定px: 无法适配不同屏幕尺寸

**References**:
- 移动端适配最佳实践: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive

---

### 8. UI组件库选择

**Decision**: 不引入大型UI组件库，使用轻量级工具库

**Rationale**:
- 移动端H5应用，体积敏感
- 现有设计相对简单，不需要复杂组件
- 自定义组件可以完全控制样式和交互
- 减少依赖，提升性能

**Tools Used**:
- clsx: 条件类名处理
- dayjs: 日期处理
- 自定义组件: TabBar、Calendar、Message等

**Alternatives considered**:
- Ant Design Mobile: 功能完整但体积较大（~200KB+）
- Vant: Vue生态，不适合React项目
- Material-UI: 体积大，不适合移动端H5

**References**:
- clsx: https://github.com/lukeed/clsx

---

### 9. 样式方案选择

**Decision**: SCSS + CSS Modules

**Rationale**:
- 保持与现有uni-app项目样式变量一致
- SCSS提供变量、嵌套、Mixins等功能
- CSS Modules提供作用域隔离，避免样式冲突
- 支持移动端适配的Mixins

**Implementation**:
```scss
// variables.scss
$primary-color: #3cc51f;
$text-color: #333333;
$bg-color: #FFFBF5;

// mixins.scss
@mixin mobile-only {
  @media (max-width: 768px) {
    @content;
  }
}
```

**Alternatives considered**:
- Tailwind CSS: 功能强大但需要学习成本，样式文件可能较大
- Styled Components: CSS-in-JS方案，但增加运行时开销
- 纯CSS: 缺少变量和嵌套支持，维护困难

**References**:
- SCSS文档: https://sass-lang.com
- CSS Modules: https://github.com/css-modules/css-modules

---

### 10. 测试方案选择

**Decision**: Vitest + React Testing Library + Playwright

**Rationale**:
- Vitest: 快速、兼容Jest API，支持TypeScript
- React Testing Library: React官方推荐，专注组件行为测试
- Playwright: 跨浏览器E2E测试，支持移动端模拟

**Test Structure**:
- 单元测试: 工具函数、Hooks、Store
- 组件测试: 组件渲染、交互、状态
- E2E测试: 关键用户流程（对话、排班查询）

**Alternatives considered**:
- Jest: 功能完整但启动速度较慢
- Cypress: E2E测试工具，但Playwright性能更好

**References**:
- Vitest文档: https://vitest.dev
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev

---

## Summary

所有技术选型已完成，无需要进一步澄清的问题。主要决策：
1. React 18 + TypeScript 作为核心框架
2. Zustand 用于状态管理
3. React Router v6 用于路由
4. 原生Fetch API实现SSE
5. 自研日历组件
6. Vite作为构建工具
7. SCSS + CSS Modules用于样式
8. Vitest + React Testing Library + Playwright用于测试

所有技术选型都考虑了移动端H5的特殊需求：体积小、性能优、体验好。
