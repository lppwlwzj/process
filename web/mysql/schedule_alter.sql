-- 修改 schedule 表，将所有字段改为允许 NULL
-- 注意：id 字段是主键，不能改为 NULL

ALTER TABLE `schedule` 
  MODIFY COLUMN `project` varchar(50) DEFAULT NULL COMMENT '项目类型',
  MODIFY COLUMN `doctor_id` int(11) DEFAULT NULL COMMENT '医生ID（关联user表）',
  MODIFY COLUMN `nurse_id` int(11) DEFAULT NULL COMMENT '护士ID（关联user表）',
  MODIFY COLUMN `customer_name` varchar(100) DEFAULT NULL COMMENT '客户姓名',
  MODIFY COLUMN `room` varchar(50) DEFAULT NULL COMMENT '诊室名称（诊室1、诊室2、诊室3、诊室4）',
  MODIFY COLUMN `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  MODIFY COLUMN `duration` int(11) DEFAULT NULL COMMENT '时长（分钟）',
  MODIFY COLUMN `end_time` datetime DEFAULT NULL COMMENT '结束时间（自动计算）',
  MODIFY COLUMN `remark` varchar(1000) DEFAULT NULL COMMENT '备注',
  MODIFY COLUMN `created_at` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  MODIFY COLUMN `updated_at` timestamp NULL DEFAULT NULL COMMENT '更新时间';
