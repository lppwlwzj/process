/*
SQLyog Ultimate v11.3 (64 bit)
MySQL - 5.7.32-log : Database - ssm9087m
*********************************************************************
*/


/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`process` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `process`;

/*Table structure for table `user` */

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username` varchar(100) NOT NULL COMMENT '用户名',
  `usercount` varchar(100) NOT NULL COMMENT '用户账号',
  `password` varchar(100) DEFAULT NULL COMMENT '密码',
  `role` varchar(50) DEFAULT NULL COMMENT '角色（技师/医生椅旁技师/其他人员）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8 COMMENT='用户表';

/*Data for the table `user` */

INSERT INTO `user` (`id`, `username`, `usercount`, `password`, `role`) VALUES 
(1, '管理员', 'admin', '123456', '其他人员'),
(2, '张三', 'zhangsan', '123456', '其他人员'),
(3, '李四', 'lisi', '123456', '其他人员'),
(4, '王五', 'wangwu', '123456', '其他人员'),
(5, '赵六', 'zhaoliu', '123456', '其他人员'),
(6, '测试用户', 'test', '123456', '其他人员'),
(7, '彭师傅', 'pengshifu', '123456', '技师'),
(8, '胥师傅', 'xushifu', '123456', '技师'),
(9, '孙师傅', 'sunshifu', '123456', '技师'),
(10, '慕有存', 'muyoucun', '123456', '其他人员'),
(11, '钱鹏飞', 'qianpengfei', '123456', '其他人员'),
(12, '郭鑫', 'guoxin', '123456', '其他人员'),
(13, '医生', 'yisheng', '123456', '其他人员'),
(14, '何锐', 'herui', '123456', '医生椅旁技师'),
(15, '于医生', 'yuyisheng', '123456', '医生椅旁技师'),
(16, '秦医生', 'qinyisheng', '123456', '医生椅旁技师'),
(17, '黄医生', 'huangyisheng', '123456', '医生椅旁技师');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
