CREATE TABLE `navi_store` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `navi_store_id` PRIMARY KEY(`id`),
	CONSTRAINT `navi_store_key_unique` UNIQUE(`key`)
);
