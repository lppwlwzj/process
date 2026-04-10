DROP TABLE IF EXISTS `customer_process`;

CREATE TABLE `customer_process` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` int(11) NOT NULL COMMENT '客户ID',
  `progress` varchar(50) DEFAULT NULL COMMENT '进度（未开始、进行中、已完成）',
  `technician` varchar(50) DEFAULT NULL COMMENT '技工师',
  `laxing_technician` varchar(50) DEFAULT NULL COMMENT '蜡型技师',
  `image` TEXT DEFAULT NULL COMMENT '图片URL',
  `mini_image` TEXT DEFAULT NULL COMMENT '小程序图片URL',
  `factory_mini_image` TEXT DEFAULT NULL COMMENT '小程序图片URL',
  `technician_audio` varchar(255) DEFAULT NULL COMMENT '技工录音URL',
  `technician_video` TEXT DEFAULT NULL COMMENT '技工视频URL',
  `web_video` TEXT DEFAULT NULL COMMENT '视频URL',
  `factory_image` TEXT DEFAULT NULL COMMENT '工厂图片URL',
  `factory_technician_video` TEXT DEFAULT NULL COMMENT '工厂技工视频URL',
  `factory_web_video` TEXT DEFAULT NULL COMMENT '工厂视频URL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_progress` (`progress`),
  KEY `idx_technician` (`technician`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户进度表';

INSERT INTO `customer_process`
(`customer_id`,`progress`)
VALUES
(1, 'not_started'),
(2, 'not_started'),
(3, 'not_started');