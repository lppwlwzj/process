CREATE TABLE IF NOT EXISTS ysd_phone (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL COMMENT '姓名',
  phone VARCHAR(32) NOT NULL COMMENT '手机号',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  contact_status TINYINT(1) NOT NULL DEFAULT 0 COMMENT '联系状态：0未联系 1已联系',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_phone (phone),
  KEY idx_created_at (created_at),
  KEY idx_contact_status (contact_status)
);
