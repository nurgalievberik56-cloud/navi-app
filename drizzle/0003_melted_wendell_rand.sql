CREATE TABLE `ad_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adId` int NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`viewsCount` int NOT NULL DEFAULT 0,
	`ordersCount` int NOT NULL DEFAULT 0,
	`totalAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `completed_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`businessId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `completed_orders_id` PRIMARY KEY(`id`)
);
