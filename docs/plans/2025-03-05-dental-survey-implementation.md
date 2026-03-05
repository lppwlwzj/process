# 牙科诊所问卷调查 H5 实现计划

基于 `2025-03-05-dental-survey-design.md`，按依赖顺序执行。

---

## Phase 0：前置准备

### 0.1 修复 App 依赖
- **问题**：App 引用 `Loading`、`TabBar`、`ErrorBoundary` 未定义
- **方案**：survey 为单页应用，不展示 TabBar；Suspense fallback 改为简单加载态；添加最小 ErrorBoundary
- **文件**：`schedule-h5-survey/src/App.tsx`
- **产出**：移除 TabBar 展示、内联或引入 Loading/ErrorBoundary

### 0.2 路由与入口
- **现状**：`/survey` 已存在，SurveyPage 为空
- **确认**：入口 URL 为 `/app/survey?customer_id=xxx`（vite base: /app）
- **无需改动**：路由配置

---

## Phase 1：后端 API

### 1.1 数据库
- **建表** `survey_rating`：
  - `id` INT PRIMARY KEY AUTO_INCREMENT
  - `customer_id` VARCHAR(64) NOT NULL
  - `reception` INT NOT NULL
  - `consultant` INT NOT NULL
  - `photographer` INT NOT NULL
  - `doctor` INT NOT NULL
  - `nurse` INT NOT NULL
  - `wax_designer` INT NOT NULL
  - `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- **SQL**：保存至 `web/mysql/`

### 1.2 路由与处理
- **新建** `serve/router/survey.js`：`POST /submit` → survey_handler.submit
- **新建** `serve/router_handler/survey.js`：校验 customer_id、6 个分值范围 [-100,100]，插入 survey_rating
- **挂载** `app.js`：`app.use("/api/survey", surveyRouter)`

---

## Phase 2：前端基础

### 2.1 类型定义
- **文件**：`schedule-h5-survey/src/types/survey.ts`（新建）
- **内容**：`SurveyRating` 接口、6 个 role key 常量

### 2.2 样式变量
- **文件**：`schedule-h5-survey/src/styles/variables.less`
- **内容**：按设计 doc 3.3 增加 survey 相关变量（背景、主色、强调色等）

### 2.3 字体
- **文件**：`schedule-h5-survey/index.html` 或全局 less
- **内容**：引入霞鹜文楷（LXGW WenKai）CDN 或本地字体

### 2.4 API 服务
- **文件**：`schedule-h5-survey/src/services/survey.ts`（新建）
- **内容**：`submitSurvey(customerId: string, ratings: SurveyRating)` 调用 POST /survey/submit

---

## Phase 3：组件实现

### 3.1 SurveyErrorState
- **路径**：`schedule-h5-survey/src/components/SurveyErrorState/index.tsx`
- **职责**：展示「请通过预约二维码进入」及图标
- **样式**：居中、暖灰色文案、与设计 doc 色彩一致

### 3.2 RatingSlider
- **路径**：`schedule-h5-survey/src/components/RatingSlider/index.tsx`
- **职责**：-100～100 范围 input[type=range]，下方「很差 / 无感 / 很好」文案
- **Props**：`value`, `onChange`
- **实现**：自定义轨道与 thumb 样式，负值左半、正值右半颜色区分（可选）

### 3.3 RatingCard
- **路径**：`schedule-h5-survey/src/components/RatingCard/index.tsx`
- **职责**：角色名 + 当前分值 + RatingSlider
- **Props**：`roleKey`, `label`, `value`, `onChange`

### 3.4 SurveyActions
- **路径**：`schedule-h5-survey/src/components/SurveyActions/index.tsx`
- **职责**：清空重填、提交按钮
- **Props**：`onReset`, `onSubmit`, `canSubmit`（6 项都已填写）
- **说明**：未填满时提交按钮禁用或 toast 提示

---

## Phase 4：页面组装

### 4.1 SurveyPage
- **文件**：`schedule-h5-survey/src/pages/SurveyPage/index.tsx`
- **逻辑**：
  1. `useSearchParams` 获取 `customer_id`
  2. 无有效值 → 渲染 SurveyErrorState
  3. 有值 → 维护 `ratings: SurveyRating` 状态，渲染 6 个 RatingCard + SurveyActions
  4. 清空重填：重置为全 0
  5. 提交：调用 submitSurvey，成功则 toast「感谢您的评价」
- **动效**：卡片 `animation-delay` 递增实现 staggered reveal

---

## Phase 5：联调与收尾

### 5.1 联调
- 启动 serve（端口 3006）
- 启动 schedule-h5-survey dev（端口 8080）
- 访问 `/app/survey?customer_id=1` 验证流程
- 访问 `/app/survey` 验证错误态

### 5.2 边界检查
- 无 customer_id：错误态
- 未填满提交：禁用或 toast
- 提交失败：toast 错误，可重试
- 离线：OfflineBanner 已存在

---

## 执行顺序

```
0.1 → 0.2 → 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 3.4 → 4.1 → 5.1 → 5.2
```

---

## 文件清单

| 操作 | 路径 |
|------|------|
| 修改 | `schedule-h5-survey/src/App.tsx` |
| 新建 | `schedule-h5-survey/src/types/survey.ts` |
| 修改 | `schedule-h5-survey/src/styles/variables.less` |
| 新建 | `schedule-h5-survey/src/services/survey.ts` |
| 新建 | `schedule-h5-survey/src/components/SurveyErrorState/index.tsx` |
| 新建 | `schedule-h5-survey/src/components/RatingSlider/index.tsx` |
| 新建 | `schedule-h5-survey/src/components/RatingCard/index.tsx` |
| 新建 | `schedule-h5-survey/src/components/SurveyActions/index.tsx` |
| 修改 | `schedule-h5-survey/src/pages/SurveyPage/index.tsx` |
| 新建 | `serve/router/survey.js` |
| 新建 | `serve/router_handler/survey.js` |
| 修改 | `serve/app.js` |
| 新建 | `serve/migrations/` 或 SQL 脚本 |
