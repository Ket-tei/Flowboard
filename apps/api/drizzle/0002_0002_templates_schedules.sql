ALTER TABLE `screens` ADD COLUMN `display_mode` enum('QUICK','TEMPLATE') NOT NULL DEFAULT 'QUICK';
--> statement-breakpoint
CREATE TABLE `template_folders` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`parent_id` bigint,
	`name` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `template_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`folder_id` bigint NOT NULL,
	`name` varchar(255) NOT NULL,
	`revision` int NOT NULL DEFAULT 0,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`template_id` bigint NOT NULL,
	`type` enum('IMAGE','VIDEO','GIF') NOT NULL,
	`storage_key` varchar(512) NOT NULL,
	`mime_type` varchar(128) NOT NULL,
	`duration_ms` int NOT NULL DEFAULT 5000,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `template_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_template_folder_access` (
	`user_id` bigint NOT NULL,
	`template_folder_id` bigint NOT NULL,
	CONSTRAINT `user_template_folder_access_user_id_template_folder_id_pk` PRIMARY KEY(`user_id`,`template_folder_id`)
);
--> statement-breakpoint
CREATE TABLE `user_template_access` (
	`user_id` bigint NOT NULL,
	`template_id` bigint NOT NULL,
	CONSTRAINT `user_template_access_user_id_template_id_pk` PRIMARY KEY(`user_id`,`template_id`)
);
--> statement-breakpoint
CREATE TABLE `screen_schedules` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`screen_id` bigint NOT NULL,
	`day_of_week` int NOT NULL,
	`start_time` varchar(5) NOT NULL,
	`end_time` varchar(5) NOT NULL,
	`template_id` bigint NOT NULL,
	CONSTRAINT `screen_schedules_id` PRIMARY KEY(`id`)
);
