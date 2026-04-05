CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`username` varchar(128) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('ADMIN','USER') NOT NULL DEFAULT 'USER',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`parent_id` bigint,
	`name` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `screens` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`folder_id` bigint NOT NULL,
	`name` varchar(255) NOT NULL,
	`public_token` varchar(36) NOT NULL,
	`revision` int NOT NULL DEFAULT 0,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `screens_id` PRIMARY KEY(`id`),
	CONSTRAINT `screens_public_token_unique` UNIQUE(`public_token`)
);
--> statement-breakpoint
CREATE TABLE `screen_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`screen_id` bigint NOT NULL,
	`type` enum('IMAGE','VIDEO','GIF') NOT NULL,
	`storage_key` varchar(512) NOT NULL,
	`mime_type` varchar(128) NOT NULL,
	`duration_ms` int NOT NULL DEFAULT 5000,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `screen_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_folder_access` (
	`user_id` bigint NOT NULL,
	`folder_id` bigint NOT NULL,
	CONSTRAINT `user_folder_access_user_id_folder_id_pk` PRIMARY KEY(`user_id`,`folder_id`)
);
--> statement-breakpoint
CREATE TABLE `user_screen_access` (
	`user_id` bigint NOT NULL,
	`screen_id` bigint NOT NULL,
	CONSTRAINT `user_screen_access_user_id_screen_id_pk` PRIMARY KEY(`user_id`,`screen_id`)
);
--> statement-breakpoint
ALTER TABLE `folders` ADD CONSTRAINT `folders_parent_id_folders_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
--> statement-breakpoint
ALTER TABLE `screens` ADD CONSTRAINT `screens_folder_id_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
--> statement-breakpoint
ALTER TABLE `screen_items` ADD CONSTRAINT `screen_items_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
--> statement-breakpoint
ALTER TABLE `user_folder_access` ADD CONSTRAINT `user_folder_access_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
--> statement-breakpoint
ALTER TABLE `user_folder_access` ADD CONSTRAINT `user_folder_access_folder_id_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
--> statement-breakpoint
ALTER TABLE `user_screen_access` ADD CONSTRAINT `user_screen_access_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
--> statement-breakpoint
ALTER TABLE `user_screen_access` ADD CONSTRAINT `user_screen_access_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
