DROP TABLE IF EXISTS `customer_process`;

CREATE TABLE `customer_process` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_name` varchar(50) NOT NULL COMMENT '客户名称',
  `wear_time` date DEFAULT NULL COMMENT '戴牙时间',
  `progress` varchar(50) DEFAULT NULL COMMENT '进度（未开始、进行中、已完成）',
  `technician` varchar(50) DEFAULT NULL COMMENT '技工师',
  `other_staff` varchar(100) DEFAULT NULL COMMENT '其他人员',
  `material` varchar(100) DEFAULT NULL COMMENT '材料',
  `image` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_progress` (`progress`),
  KEY `idx_technician` (`technician`),
  KEY `idx_wear_time` (`wear_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户进度表';

-- 插入示例数据
INSERT INTO `customer_process` (`customer_name`, `wear_time`, `progress`, `technician`, `other_staff`, `material`, `image`, `remark`) VALUES
('张三', '2024-01-15', '未开始', '李师傅', '王助理', '金属托槽', 'https://via.placeholder.com/200', '需要特别注意牙齿排列'),
('李四', '2024-01-20', '进行中', '王师傅', '张助理', '陶瓷托槽', 'https://via.placeholder.com/200', '进展顺利'),
('王五', '2024-02-01', '已完成', '赵师傅', NULL, '隐形矫正器', 'https://via.placeholder.com/200', '客户非常满意'),
('赵六', '2024-02-10', '进行中', '李师傅', '李助理', '金属托槽', 'https://via.placeholder.com/200', '需要加强清洁指导'),
('孙七', '2024-02-15', '未开始', '陈师傅', NULL, '自锁托槽', NULL, '等待材料到货');

