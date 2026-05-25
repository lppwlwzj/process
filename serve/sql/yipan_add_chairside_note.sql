ALTER TABLE `yipan`
  ADD COLUMN `chairside_note` text DEFAULT NULL COMMENT '椅旁问题描述' AFTER `yipan_image`;
