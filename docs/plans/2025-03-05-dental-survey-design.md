# 牙科诊所问卷调查 H5 设计文档

## 1. 概述

| 项目 | 说明 |
|------|------|
| 项目名 | schedule-h5-survey |
| 入口 | 扫码进入 `/survey?customer_id=xxx` |
| 技术栈 | React 18 + TypeScript + Vite + antd-mobile + Less |

### 需求摘要
- 对 6 个角色打分：前台人员、咨询师、拍摄人员、医生、护士、蜡型设计师
- 分值范围 -100～100，滑动输入条
- 滑块下文案：-100 下方「很差」、0 下方「无感」、100 下方「很好」
- 提交前可「清空重填」，提交后不可修改
- 必须全部 6 项打分方可提交
- 无 customer_id 时禁止填写，提示「请通过预约二维码进入」
- 数据提交至 serve 后端

---

## 2. 页面结构与交互

### 2.1 路由与参数
- 路径：`/survey`
- 查询参数：`customer_id` 或 `cid`
- 无有效 customer_id → 显示错误态，不渲染表单

### 2.2 页面布局（自上而下）
1. **顶部**：标题「服务评价」
2. **主体**：6 个评价卡片，单页垂直滚动
3. **底部**：`清空重填` `提交` 按钮

### 2.3 单卡片结构
```
┌─────────────────────────────────┐
│ 角色名称                         │
│ [当前分值]                       │
│ ●━━━━━━━━━━━━━━━━━━━━━━━  │
│  -100       0        100
   很差      无感       很好         │
└─────────────────────────────────┘
```

- 滑块默认值：0
- 分值实时显示
---

## 3. 前端美学设计（frontend-design）

### 3.1 设计定位
- **Purpose**：患者就诊后快速完成服务评价，建立信任感
- **Tone**：温润、克制、有品质感（luxury/refined + organic/natural）
- **Differentiation**：像高端诊所的体验卡，而非通用表单

### 3.2  typography
- **标题**：霞鹜文楷 LXGW WenKai（或思源宋体）— 温和人文感
- **正文**：苹方 / PingFang SC，fallback：-apple-system
- **避免**：Inter、Roboto、Arial、系统默认 sans-serif 堆砌

### 3.3 色彩
| 角色 | 色值 | 用途 |
|------|------|------|
| 背景 | `#FAF8F5` | 暖米白 |
| 卡片 | `#FFFFFF` | 纯白，微阴影 |
| 主色 | `#2D6A6A` | 石绿色，按钮、滑块轨迹 |
| 强调 | `#C17F59` | 琥珀色，滑块、选中态 |
| 文字 | `#3C3836` | 暖灰 |
| 辅助 | `#8C8C8C` | 次要文案、刻度 |
| 负分 | `#B85450` | 分值 <0 时的数字 |
| 正分 | `#2D6A6A` | 分值 ≥0 时的数字 |

### 3.4 空间与布局
- 卡片间距：16px
- 内边距：20px
- 大留白，避免拥挤
- 卡片圆角：12px，轻微 `box-shadow`

### 3.5 动效
- 页面进入：卡片自下而上 `staggered reveal`，`animation-delay` 递增
- 滑块拖动：轨道颜色渐变过渡，thumb 轻微放大
- 提交成功：简短感谢动画或 toast
- 以 CSS 为主，减少 JS 动画

### 3.6 背景与细节
- 背景：暖米白 + 极 subtle 的 noise/grain（可选）
- 卡片：`box-shadow: 0 2px 12px rgba(45, 106, 106, 0.06)`
- 滑块：自定义轨道与 thumb，避免 antd-mobile 默认样式

### 3.7 禁止项
- 不用紫色渐变、紫白配色
- 不用 Inter、Roboto、Space Grotesk
- 不用大面积紫色/蓝色渐变背景

---

## 4. 数据与接口

### 4.1 前端数据结构
```ts
type SurveyRating = {
  reception: number      // 前台人员
  consultant: number     // 咨询师
  photographer: number  // 拍摄人员
  doctor: number        // 医生
  nurse: number        // 护士
  waxDesigner: number  // 蜡型设计师
}
```

### 4.2 提交 API
- `POST /api/survey/submit`
- Body：`{ customer_id: string; ratings: SurveyRating }`
- 成功：`{ code: 0 }`
- 失败：`{ code: 1, message: string }`

### 4.3 后端
- serve 新增 `router/survey.js`、`router_handler/survey.js`
- 建表 `survey_rating`：customer_id, 6 个评分数值, created_at

---

## 5. 异常与边界

| 场景 | 处理 |
|------|------|
| 无 customer_id | 提示「请通过预约二维码进入」，不显示表单 |
| customer_id 无效 | 同无 customer_id |
| 未填满 6 项 | 提交按钮禁用或点击时 toast 提示 |
| 提交失败 | toast 展示错误信息，可重试 |
| 网络断开 | 复用现有 OfflineBanner |

---

## 6. 组件拆分建议

- `SurveyPage`：页面容器，解析 URL、校验 customer_id
- `SurveyErrorState`：无 customer_id 时的错误态
- `RatingCard`：单个角色卡片（角色名 + 滑块 + 刻度文案）
- `RatingSlider`：-100～100 滑块，含「很差/无感/很好」
- `SurveyActions`：清空重填 + 提交按钮
