DROP TABLE IF EXISTS `yipan`;

CREATE TABLE `yipan` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` int(11) NOT NULL COMMENT '客户ID',
  `customer_name` varchar(50) NOT NULL COMMENT '客户名称',
  `chairside_doctor` varchar(50) DEFAULT NULL COMMENT '椅旁医生/椅旁技师',
  `daily_wear_status` tinyint(1) DEFAULT NULL COMMENT '当日是否戴牙（0-未戴牙，1-已戴牙）',
  `chairside_audio` varchar(255) DEFAULT NULL COMMENT '椅旁录音URL',
  `chairside_video` varchar(255) DEFAULT NULL COMMENT '椅旁视频URL',
  `operation_type` varchar(20) DEFAULT NULL COMMENT '操作类型（start-开始椅旁，complete-完成椅旁）',
  `operation_time` datetime DEFAULT NULL COMMENT '操作时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_chairside_doctor` (`chairside_doctor`),
  KEY `idx_operation_time` (`operation_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='椅旁操作记录表';
