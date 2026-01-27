DROP TABLE IF EXISTS `project_duration_config`;

CREATE TABLE `project_duration_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `project` varchar(50) NOT NULL COMMENT '项目类型',
  `default_duration` int(11) NOT NULL COMMENT '默认时长（分钟）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project` (`project`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目类型默认时长配置表';

INSERT INTO `project_duration_config` (`project`, `default_duration`) VALUES
('面诊', 40),
('备牙', 70),
('戴牙', 90),
('复诊', 30),
('雕蜡', 60),
('蜡形试戴', 45);
