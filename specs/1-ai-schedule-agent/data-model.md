# AI智能排班助手数据模型

## 数据库表结构

### conversation_memory (对话记忆表)

存储用户与AI助手的对话历史，支持30天跨会话记忆。

```sql
CREATE TABLE `conversation_memory` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `session_id` varchar(100) NOT NULL COMMENT '会话ID（UUID）',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID（可选，用于多用户场景）',
  `role` enum('user','assistant') NOT NULL COMMENT '消息角色',
  `content` text NOT NULL COMMENT '消息内容',
  `metadata` json DEFAULT NULL COMMENT '元数据（提取的信息、工具调用结果等）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话记忆表';
```

**字段说明**:
- `session_id`: 会话唯一标识，前端生成 UUID
- `user_id`: 关联用户表，可选（支持多用户场景）
- `role`: 消息角色，'user' 为用户输入，'assistant' 为AI回复
- `content`: 消息文本内容
- `metadata`: JSON字段，存储结构化信息：
  ```json
  {
    "extracted_info": {
      "date": "2025-01-28",
      "doctor_name": "王医生",
      "nurse_name": "李护士",
      "customer_name": "李XX",
      "project": "拔牙",
      "start_time": "13:00",
      "duration": 30,
      "buffer_time": 10,
      "room": "诊室1",
      "remark": "客户要求提前准备"
    },
    "tool_calls": [
      {
        "tool": "query_schedule",
        "input": {...},
        "output": {...}
      }
    ],
    "conflict_check": {
      "has_conflict": false,
      "conflict_types": []
    }
  }
  ```

### project_duration_config (项目类型默认时长配置表)

存储项目类型与默认时长的映射关系。

```sql
CREATE TABLE `project_duration_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `project` varchar(50) NOT NULL COMMENT '项目类型',
  `default_duration` int(11) NOT NULL COMMENT '默认时长（分钟）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project` (`project`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目类型默认时长配置表';
```

**初始数据**:
```sql
INSERT INTO `project_duration_config` (`project`, `default_duration`) VALUES
('依口', 30),
('固定修复', 60),
('活动修复', 45),
('拔牙', 30),
('补牙', 20),
('洗牙', 15),
('其他', 30);
```

## 数据实体

### ConversationSession (会话实体)

```typescript
interface ConversationSession {
  session_id: string;           // UUID
  user_id?: number;            // 可选
  created_at: Date;
  last_active_at: Date;
  extracted_info?: ScheduleQueryInfo;  // 已提取的排班信息
}
```

### ConversationMessage (消息实体)

```typescript
interface ConversationMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    extracted_info?: ScheduleQueryInfo;
    tool_calls?: ToolCall[];
    conflict_check?: ConflictCheckResult;
  };
  created_at: Date;
}
```

### ScheduleQueryInfo (排班查询信息)

从对话中提取的结构化信息。

```typescript
interface ScheduleQueryInfo {
  date?: string;              // 日期（可能为相对时间，如"今天"）
  doctor_name?: string;       // 医生姓名
  nurse_name?: string;        // 护士姓名（可选）
  customer_name?: string;     // 客户姓名
  project?: string;           // 项目类型
  start_time?: string;        // 开始时间（可能为相对时间，如"13点"）
  duration?: number;          // 时长（分钟）
  buffer_time?: number;       // 缓冲时间（分钟，可选）
  room?: string;              // 诊室（可选）
  remark?: string;            // 备注（可选，用户可以在对话中提供）
  is_vip_priority?: boolean;  // 是否为VIP优先插入（可选）
}
```

### ConflictCheckResult (冲突检测结果)

```typescript
interface ConflictCheckResult {
  has_conflict: boolean;
  conflict_types: ('doctor' | 'nurse' | 'room')[];
  conflict_details: Array<{
    type: 'doctor' | 'nurse' | 'room';
    message: string;
    conflicting_schedule?: {
      id: number;
      customer_name: string;
      project: string;
      start_time: string;
      end_time: string;
    };
  }>;
  suggested_times?: string[];  // 建议的替代时间段
}
```

### SuggestedSchedule (建议排班)

AI自动分配资源后生成的排班建议。

```typescript
interface SuggestedSchedule {
  project: string;
  doctor_id: number;
  nurse_id?: number;
  customer_id: number;
  room: string;
  start_time: string;         // YYYY-MM-DD HH:mm:ss
  duration: number;            // 分钟
  end_time: string;            // YYYY-MM-DD HH:mm:ss
  remark?: string;
}
```

## 数据关系

```
conversation_memory
  ├── session_id (索引)
  ├── user_id -> user.id (外键，可选)
  └── metadata.extracted_info -> ScheduleQueryInfo

project_duration_config
  └── project (唯一索引)

schedule (现有表)
  ├── doctor_id -> user.id
  ├── nurse_id -> user.id
  └── customer_id -> customer.id
```

## 数据验证规则

### conversation_memory
- `session_id`: 必填，长度 1-100 字符
- `role`: 必填，只能是 'user' 或 'assistant'
- `content`: 必填，不能为空
- `metadata`: 可选，必须是有效的 JSON

### project_duration_config
- `project`: 必填，长度 1-50 字符，唯一
- `default_duration`: 必填，必须 > 0

## 索引策略

1. **conversation_memory**:
   - `idx_session_id`: 快速查询会话历史
   - `idx_created_at`: 支持30天清理和按时间排序
   - `idx_user_id`: 支持按用户查询（如果启用多用户）

2. **project_duration_config**:
   - `uk_project`: 唯一索引，确保项目类型不重复

## 数据清理策略

### 自动清理过期记忆
```sql
-- 删除30天前的对话记录
DELETE FROM conversation_memory 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

**执行方式**:
- 方案1: MySQL Event（推荐）
  ```sql
  CREATE EVENT cleanup_old_memories
  ON SCHEDULE EVERY 1 DAY
  DO
    DELETE FROM conversation_memory 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
  ```
- 方案2: 定时任务（cron）
  - 每天凌晨执行清理脚本

## 数据迁移

### 初始化脚本
1. 创建 `conversation_memory` 表
2. 创建 `project_duration_config` 表
3. 插入初始项目类型配置数据

### 升级路径
- 未来可添加 `conversation_summary` 表存储对话摘要
- 可添加 `user_preferences` 表存储用户偏好（如默认医生、常用项目等）
