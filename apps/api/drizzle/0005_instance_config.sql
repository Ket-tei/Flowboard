CREATE TABLE IF NOT EXISTS `instance_config` (
  `id` INT NOT NULL DEFAULT 1,
  `plan_id` ENUM('FREE','PREMIUM','PRO') NOT NULL DEFAULT 'FREE',
  CONSTRAINT `instance_config_id` PRIMARY KEY (`id`)
);
--> statement-breakpoint
INSERT IGNORE INTO `instance_config` (`id`, `plan_id`) VALUES (1, 'FREE');
