DROP TABLE IF EXISTS `customer_process_history`;

CREATE TABLE `customer_process_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` int(11) NOT NULL COMMENT '客户ID',
  `customer_name` varchar(50) NOT NULL COMMENT '客户名称',
  `progress` varchar(50) NOT NULL COMMENT '当前进度',
  `technician` varchar(50) NOT NULL COMMENT '当前技工师',
  `start_time` datetime NOT NULL COMMENT '开始操作时间',
  `duration_minutes` int(11) DEFAULT NULL COMMENT '距离上次操作的时长（分钟）',
  `previous_progress` varchar(50) DEFAULT NULL COMMENT '上一次的进度',
  `previous_technician` varchar(50) DEFAULT NULL COMMENT '上一次的技工师',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户进度操作历史表';
