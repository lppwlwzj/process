DROP TABLE IF EXISTS `customer_process`;

CREATE TABLE `customer_process` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` int(11) NOT NULL COMMENT '客户ID',
  `customer_name` varchar(50) NOT NULL COMMENT '客户名称',
  `wear_time` date DEFAULT NULL COMMENT '戴牙时间',
  `progress` varchar(50) DEFAULT NULL COMMENT '进度（未开始、进行中、已完成）',
  `technician` varchar(50) DEFAULT NULL COMMENT '技工师',
  `other_staff` varchar(100) DEFAULT NULL COMMENT '其他人员',
  `material` varchar(100) DEFAULT NULL COMMENT '材料',
  `image` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `technician_audio` varchar(255) DEFAULT NULL COMMENT '技工录音URL',
  `technician_video` varchar(255) DEFAULT NULL COMMENT '技工视频URL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_progress` (`progress`),
  KEY `idx_technician` (`technician`),
  KEY `idx_wear_time` (`wear_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户进度表';

