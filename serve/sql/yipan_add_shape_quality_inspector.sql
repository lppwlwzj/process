ALTER TABLE `yipan`
  ADD COLUMN `shape_quality_inspector` varchar(50) DEFAULT NULL COMMENT '形态质检师' AFTER `customer_id`,
  ADD KEY `idx_shape_quality_inspector` (`shape_quality_inspector`);

ALTER TABLE `yipan_history`
  ADD COLUMN `shape_quality_inspector` varchar(50) DEFAULT NULL COMMENT '形态质检师' AFTER `progress`,
  ADD KEY `idx_shape_quality_inspector` (`shape_quality_inspector`);
