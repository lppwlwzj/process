DROP TABLE IF EXISTS `customer`;

CREATE TABLE `customer` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `customer_name` varchar(50) NOT NULL COMMENT '客户姓名',
  `wear_time` varchar(50) DEFAULT NULL COMMENT '戴牙时间',
  `preparation_time` varchar(50) DEFAULT NULL COMMENT '备牙时间',
  `doctor` varchar(50) DEFAULT NULL COMMENT '医生（宇医生、秦医生、蔡医生等）',
  `materials` JSON DEFAULT NULL COMMENT '材料数组，格式: [{"material":"xxx","quantity":4}]',
  `image` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `qr_code` varchar(255) DEFAULT NULL COMMENT '二维码图片URL',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_doctor` (`doctor`),
  KEY `idx_wear_time` (`wear_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户进度表';

-- 插入示例数据
INSERT INTO `customer` (`customer_name`, `wear_time`, `doctor`, `materials`, `remark`) VALUES
('王宇秋', '2025-12-02', '宇医生', '[{"material":"guochan_quancitiemin","quantity":4}]', '依口修复4颗'),
('古慧珠', '2025-12-01', '宇医生', '[{"material":"deguo_aidisiteyanghuagao","quantity":16}]', '依口16颗'),
('钟欣博', '2025-12-03', '宇医生', '[{"material":"guochan_quancitiemin","quantity":9}]', '依口9颗、依口8颗上牙体挂瓷、依口1颗下...');

