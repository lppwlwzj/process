DROP TABLE IF EXISTS `yipan_history`;

CREATE TABLE `yipan_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` int(11) NOT NULL COMMENT '客户ID',
  `customer_name` varchar(50) NOT NULL COMMENT '客户名称',
  `progress` varchar(50) DEFAULT NULL COMMENT '客户进度',
  `shape_quality_inspector` varchar(50) DEFAULT NULL COMMENT '形态质检师',
  `chairside_doctor` varchar(50) NOT NULL COMMENT '椅旁医生/椅旁技师',
  `start_time` datetime NOT NULL COMMENT '开始椅旁时间',
  `end_time` datetime NOT NULL COMMENT '结束椅旁时间',
  `duration_minutes` int(11) DEFAULT NULL COMMENT '椅旁总时长（分钟）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_shape_quality_inspector` (`shape_quality_inspector`),
  KEY `idx_chairside_doctor` (`chairside_doctor`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='椅旁操作历史记录表';
