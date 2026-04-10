DROP TABLE IF EXISTS `laxing_history`;

CREATE TABLE `laxing_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_id` int(11) NOT NULL COMMENT '客户ID，关联 customer.id',
  `technician` varchar(50) NOT NULL COMMENT '新技师（切换后）',
  `prev_technician` varchar(50) DEFAULT NULL COMMENT '上一个技师（切换前，首次为空）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_technician` (`technician`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='蜡型技师切换记录表';
