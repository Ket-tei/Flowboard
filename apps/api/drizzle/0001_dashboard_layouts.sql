CREATE TABLE `dashboard_layouts` (
	`user_id` bigint NOT NULL,
	`layout_json` varchar(8000) NOT NULL DEFAULT '[]',
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_layouts_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `dashboard_layouts` ADD CONSTRAINT `dashboard_layouts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
