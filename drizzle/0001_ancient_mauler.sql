CREATE TABLE `cron_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_name` text NOT NULL,
	`cron_expression` text NOT NULL,
	`params` text,
	`enabled` integer DEFAULT true NOT NULL,
	`last_run_at` integer,
	`next_run_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "cron_expression_not_empty" CHECK(length("cron_jobs"."cron_expression") > 0)
);
--> statement-breakpoint
CREATE INDEX `cron_jobs_next_run_idx` ON `cron_jobs` (`enabled`,`next_run_at`);--> statement-breakpoint
CREATE INDEX `cron_jobs_name_idx` ON `cron_jobs` (`job_name`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_name` text NOT NULL,
	`params` text,
	`result` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`progress` integer DEFAULT 0,
	`progress_message` text,
	`error` text,
	`worker_started_at` integer,
	`worker_expires_at` integer,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	CONSTRAINT "progress_range" CHECK("jobs"."progress" >= 0 AND "jobs"."progress" <= 100)
);
--> statement-breakpoint
CREATE INDEX `jobs_status_expires_idx` ON `jobs` (`status`,`worker_expires_at`);--> statement-breakpoint
CREATE INDEX `jobs_name_idx` ON `jobs` (`job_name`);--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);