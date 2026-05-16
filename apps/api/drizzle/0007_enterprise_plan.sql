ALTER TABLE `instance_config`
  MODIFY COLUMN `plan_id` ENUM('FREE', 'PREMIUM', 'PRO', 'ENTERPRISE') NOT NULL DEFAULT 'FREE',
  ADD COLUMN `custom_screen_limit` INT NULL;
