DROP TABLE IF EXISTS `schedule`;

CREATE TABLE `schedule` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `project` varchar(50) DEFAULT NULL COMMENT '项目类型',
  `doctor_id` int(11) DEFAULT NULL COMMENT '医生ID（关联user表）',
  `nurse_id` int(11) DEFAULT NULL COMMENT '护士ID（关联user表）',
  `customer_name` varchar(100) DEFAULT NULL COMMENT '客户姓名',
  `room` varchar(50) DEFAULT NULL COMMENT '诊室名称（诊室1、诊室2、诊室3、诊室4）',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `duration` int(11) DEFAULT NULL COMMENT '时长（分钟）',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间（自动计算）',
  `remark` varchar(1000) DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_doctor_id` (`doctor_id`),
  KEY `idx_nurse_id` (`nurse_id`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_room` (`room`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='排班表';
