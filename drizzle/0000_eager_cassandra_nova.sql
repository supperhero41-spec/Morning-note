CREATE TABLE `feed_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`attempted_at` integer DEFAULT 0 NOT NULL,
	`succeeded_at` integer DEFAULT 0 NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `site_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `refresh_leases` (
	`key` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL
);
