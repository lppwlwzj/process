DROP TABLE IF EXISTS `conversation_memory`;

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
