ALTER TABLE ysd_phone
  ADD COLUMN contact_status TINYINT(1) NOT NULL DEFAULT 0 COMMENT '联系状态：0未联系 1已联系' AFTER remark,
  ADD KEY idx_contact_status (contact_status);
