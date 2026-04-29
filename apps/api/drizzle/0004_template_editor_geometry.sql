ALTER TABLE `template_items` ADD COLUMN `transition_duration_ms` INT NOT NULL DEFAULT 350;
ALTER TABLE `template_widgets`
  ADD COLUMN `x` DECIMAL(5,4) NOT NULL DEFAULT 0.8500,
  ADD COLUMN `y` DECIMAL(5,4) NOT NULL DEFAULT 0.0400,
  ADD COLUMN `w` DECIMAL(5,4) NOT NULL DEFAULT 0.1300,
  ADD COLUMN `h` DECIMAL(5,4) NOT NULL DEFAULT 0.1000,
  ADD COLUMN `start_ms` INT NULL,
  ADD COLUMN `end_ms` INT NULL;
UPDATE `template_widgets` SET `x`=0.0200, `y`=0.0400 WHERE `position`='TOP_LEFT';
UPDATE `template_widgets` SET `x`=0.8500, `y`=0.0400 WHERE `position`='TOP_RIGHT';
UPDATE `template_widgets` SET `x`=0.0200, `y`=0.8500 WHERE `position`='BOTTOM_LEFT';
UPDATE `template_widgets` SET `x`=0.8500, `y`=0.8500 WHERE `position`='BOTTOM_RIGHT';
