ALTER TABLE `template_items` ADD COLUMN `transition_type` enum('NONE','FADE','SLIDE_LEFT','SLIDE_UP') NOT NULL DEFAULT 'NONE';
--> statement-breakpoint
CREATE TABLE `template_widgets` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`template_id` bigint NOT NULL,
	`type` enum('WEATHER_CURRENT') NOT NULL,
	`position` enum('TOP_LEFT','TOP_RIGHT','BOTTOM_LEFT','BOTTOM_RIGHT') NOT NULL DEFAULT 'TOP_RIGHT',
	`config` varchar(1024) NOT NULL DEFAULT '{}',
	CONSTRAINT `template_widgets_id` PRIMARY KEY(`id`)
);
