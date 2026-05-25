ALTER TABLE `customer_process`
  ADD COLUMN `intraoral_adjuster` varchar(50) DEFAULT NULL COMMENT '口内调改师' AFTER `laxing_technician`,
  ADD KEY `idx_intraoral_adjuster` (`intraoral_adjuster`);
