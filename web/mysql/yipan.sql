DROP TABLE IF EXISTS `yipan`;

CREATE TABLE `yipan` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` int(11) NOT NULL COMMENT '客户ID',
  `customer_name` varchar(50) NOT NULL COMMENT '客户名称',
  `chairside_doctor` varchar(50) DEFAULT NULL COMMENT '椅旁医生/椅旁技师',
  `quality_check_status` tinyint(1) DEFAULT NULL COMMENT '质检是否成功（0-未成功，1-成功）',
  `daily_wear_status` tinyint(1) DEFAULT NULL COMMENT '当日是否戴牙（0-未戴牙，1-已戴牙）',
  `chairside_audio` varchar(255) DEFAULT NULL COMMENT '椅旁录音URL',
  `chairside_video` varchar(255) DEFAULT NULL COMMENT '椅旁视频URL',
  `start_time` datetime DEFAULT NULL COMMENT '开始椅旁时间（有值表示正在进行椅旁操作）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_chairside_doctor` (`chairside_doctor`),
  KEY `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='椅旁操作当前状态表';

-- 插入示例数据（从customer表同步客户信息）
INSERT INTO `yipan` (`customer_id`, `customer_name`) VALUES
(1, '王宇秋'),
(2, '古慧珠'),
(3, '钟欣博'),
(4, '刘佳'),
(5, '顾姿'),
(6, '吴淀煊'),
(7, '蒋泽洋'),
(8, '洗秋玲'),
(9, '尹梦'),
(10, '苏林'),
(11, '张妍'),
(12, '庞晶怡'),
(13, '巴妍'),
(14, '杨都尼'),
(15, '张美俞'),
(16, '雄文杰'),
(17, '李祝晗'),
(18, '刘霞'),
(19, '古慧珠'),
(20, '洗秋玲'),
(21, '邓霓雪'),
(22, '黄泽样'),
(23, '唐姿'),
(24, '王怡'),
(25, '刘雅雯');
