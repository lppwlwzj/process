ALTER TABLE `customer_process`
  ADD COLUMN `progress_note` text DEFAULT NULL COMMENT '进度问题描述' AFTER `progress`;

ALTER TABLE `customer_process_history`
  ADD COLUMN `progress_note` text DEFAULT NULL COMMENT '进度问题描述' AFTER `technician`;
