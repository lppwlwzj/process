# Data Model: 智能排班助手H5前端应用

**Date**: 2026-01-26  
**Feature**: React技术栈迁移

## Entities

### 1. ChatMessage (聊天消息)

**Description**: 对话页面中的单条消息，可以是用户消息或AI助手消息

**Fields**:
- `id: string` - 消息唯一标识
- `role: 'user' | 'assistant'` - 消息角色（用户/AI）
- `content: string` - 消息内容
- `timestamp: number` - 时间戳（毫秒）
- `type?: 'text' | 'confirm' | 'error'` - 消息类型（文本/确认/错误）
- `scheduleData?: ScheduleData` - 关联的排班数据（AI建议创建排班时）
- `isStreaming?: boolean` - 是否正在流式输出

**Relationships**:
- 属于 ChatSession（多对一）

**Validation Rules**:
- `id` 必须唯一
- `role` 必须是 'user' 或 'assistant'
- `content` 不能为空
- `timestamp` 必须为正整数

**State Transitions**:
- 创建 → 流式输出中 → 完成
- 创建 → 错误

---

### 2. ChatSession (聊天会话)

**Description**: 用户的对话会话，包含会话ID和消息列表

**Fields**:
- `sessionId: string` - 会话唯一标识
- `userId: string` - 用户ID
- `messages: ChatMessage[]` - 消息列表
- `createdAt: number` - 创建时间戳
- `updatedAt: number` - 最后更新时间戳
- `isConnecting: boolean` - 是否正在连接（SSE）

**Relationships**:
- 属于 User（多对一）
- 包含多个 ChatMessage（一对多）

**Validation Rules**:
- `sessionId` 必须唯一
- `userId` 不能为空
- `messages` 必须是数组

**State Transitions**:
- 创建 → 活跃 → 结束
- 创建 → 错误 → 重连

---

### 3. Schedule (排班记录)

**Description**: 单条排班记录，包含时间、医生、客户等信息

**Fields**:
- `id: string` - 排班唯一标识
- `date: string` - 日期（YYYY-MM-DD格式）
- `startTime: string` - 开始时间（HH:mm格式）
- `endTime: string` - 结束时间（HH:mm格式）
- `doctorId: string` - 医生ID
- `doctorName: string` - 医生姓名
- `nurseId?: string` - 护士ID（可选）
- `nurseName?: string` - 护士姓名（可选）
- `customerId: string` - 客户ID
- `customerName: string` - 客户姓名
- `projectType: ProjectType` - 项目类型
- `roomId: string` - 诊室ID
- `roomName: string` - 诊室名称
- `remark?: string` - 备注（可选）
- `isVip: boolean` - 是否VIP客户
- `createdAt: number` - 创建时间戳
- `updatedAt: number` - 更新时间戳

**Relationships**:
- 属于 Doctor（多对一）
- 属于 Customer（多对一）
- 属于 Room（多对一）
- 可选属于 Nurse（多对一）

**Validation Rules**:
- `date` 必须是有效的日期格式
- `startTime` 和 `endTime` 必须是有效的时间格式
- `endTime` 必须晚于 `startTime`
- `doctorId`、`customerId`、`roomId` 不能为空
- `projectType` 必须在允许的类型列表中

**State Transitions**:
- 创建 → 已确认 → 已完成
- 创建 → 已取消

---

### 4. ProjectType (项目类型)

**Description**: 排班项目类型枚举

**Values**:
- `'面诊'` - 面诊，无需冲突判断
- `'备牙'` - 备牙，需要冲突判断
- `'戴牙'` - 戴牙，需要冲突判断
- `'椅旁'` - 椅旁，无需冲突判断
- `'复诊'` - 复诊，需要冲突判断
- `'雕蜡'` - 雕蜡，无需冲突判断
- `'蜡形试戴'` - 蜡形试戴，需要冲突判断

**Conflict Check Rules**:
- 无需冲突判断: 面诊、雕蜡、椅旁
- 需要冲突判断: 备牙、戴牙、复诊、蜡形试戴

---

### 5. ScheduleFilter (排班筛选条件)

**Description**: 排班列表的筛选条件

**Fields**:
- `date?: string` - 日期（YYYY-MM-DD格式）
- `dateRange?: [string, string]` - 日期范围
- `doctorId?: string` - 医生ID
- `roomId?: string` - 诊室ID
- `projectType?: ProjectType` - 项目类型

**Relationships**:
- 用于筛选 Schedule（一对多）

**Validation Rules**:
- `date` 和 `dateRange` 不能同时存在
- `dateRange` 的第一个日期必须早于或等于第二个日期

---

### 6. TimeSlotGroup (时间段分组)

**Description**: 排班记录按时间段分组显示

**Fields**:
- `period: 'morning' | 'afternoon'` - 时间段（早上/下午）
- `startHour: number` - 开始小时（0-23）
- `endHour: number` - 结束小时（0-23）
- `schedules: Schedule[]` - 该时间段的排班列表

**Grouping Rules**:
- 早上: 00:00 - 12:00
- 下午: 12:00 - 19:00

**Relationships**:
- 包含多个 Schedule（一对多）

---

### 7. Doctor (医生)

**Description**: 医生信息

**Fields**:
- `id: string` - 医生ID
- `name: string` - 医生姓名
- `title?: string` - 职称（可选）

**Relationships**:
- 拥有多个 Schedule（一对多）

---

### 8. Customer (客户)

**Description**: 客户信息

**Fields**:
- `id: string` - 客户ID
- `name: string` - 客户姓名
- `isVip: boolean` - 是否VIP客户
- `phone?: string` - 联系电话（可选）

**Relationships**:
- 拥有多个 Schedule（一对多）

---

### 9. Room (诊室)

**Description**: 诊室信息

**Fields**:
- `id: string` - 诊室ID
- `name: string` - 诊室名称
- `capacity?: number` - 容量（可选）

**Relationships**:
- 拥有多个 Schedule（一对多）

---

### 10. Nurse (护士)

**Description**: 护士信息（机动资源）

**Fields**:
- `id: string` - 护士ID
- `name: string` - 护士姓名

**Relationships**:
- 可选属于多个 Schedule（多对多）

**Special Rules**:
- 护士为机动资源，不进行冲突判断
- 不计算可用护士
- 如果用户指定了护士则使用，否则为空

---

## Store State Models

### ChatStore State

```typescript
interface ChatStoreState {
  sessionId: string
  messages: ChatMessage[]
  isConnecting: boolean
  error: string | null
}
```

**Actions**:
- `setSessionId(id: string)`
- `addMessage(message: ChatMessage)`
- `updateMessage(id: string, updates: Partial<ChatMessage>)`
- `clearMessages()`
- `setConnecting(connecting: boolean)`
- `setError(error: string | null)`
- `loadSessionId()`
- `loadHistory(sessionId: string)`
```

---

### ScheduleStore State

```typescript
interface ScheduleStoreState {
  scheduleList: Schedule[]
  selectedDate: string | null
  filter: ScheduleFilter
  doctors: Doctor[]
  rooms: Room[]
  loading: boolean
  error: string | null
}
```

**Actions**:
- `setScheduleList(schedules: Schedule[])`
- `addSchedule(schedule: Schedule)`
- `updateSchedule(id: string, updates: Partial<Schedule>)`
- `deleteSchedule(id: string)`
- `setSelectedDate(date: string | null)`
- `setFilter(filter: Partial<ScheduleFilter>)`
- `setDoctors(doctors: Doctor[])`
- `setRooms(rooms: Room[])`
- `setLoading(loading: boolean)`
- `setError(error: string | null)`
- `loadScheduleList(filter: ScheduleFilter)`
```

---

## Data Flow

### Chat Flow
1. 用户输入消息 → `ChatStore.addMessage(userMessage)`
2. 发送SSE请求 → `sendChatMessage(params)`
3. 接收流式响应 → `ChatStore.addMessage(assistantMessage)` (流式更新)
4. 保存到本地存储 → `localStorage.setItem('chat_history')`

### Schedule Flow
1. 用户选择日期/筛选条件 → `ScheduleStore.setFilter(filter)`
2. 加载排班列表 → `loadScheduleList(filter)`
3. 更新Store → `ScheduleStore.setScheduleList(schedules)`
4. 按时间段分组显示 → `groupByTimeSlot(schedules)`

### Schedule Creation Flow
1. AI建议创建排班 → `ChatMessage.scheduleData`
2. 用户确认 → `confirmSchedule(scheduleData)`
3. 创建成功 → `ScheduleStore.addSchedule(newSchedule)`
4. 刷新列表 → `loadScheduleList(currentFilter)`

---

## Validation Rules Summary

### ChatMessage
- 内容不能为空
- 角色必须是有效值
- 时间戳必须有效

### Schedule
- 日期格式: YYYY-MM-DD
- 时间格式: HH:mm
- 结束时间必须晚于开始时间
- 项目类型必须在允许列表中
- 医生、客户、诊室ID不能为空

### ScheduleFilter
- 日期格式必须有效
- 日期范围必须合理

---

## Local Storage Schema

```typescript
interface LocalStorageData {
  chat_session_id: string
  chat_history: {
    [sessionId: string]: ChatMessage[]
  }
  schedule_filter: ScheduleFilter
  selected_date: string
}
```
