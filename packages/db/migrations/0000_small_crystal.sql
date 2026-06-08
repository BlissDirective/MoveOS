CREATE TYPE "public"."agent_task_status" AS ENUM('queued', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('setup', 'quote', 'internet', 'utility', 'address', 'service', 'timeline', 'moving_day', 'settled', 'reply_parse', 'manual');--> statement-breakpoint
CREATE TYPE "public"."approval_priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('awaiting_approval', 'approved', 'rejected', 'edited_approved', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."home_size" AS ENUM('studio', '1br', '2br', '3br', '4br_plus');--> statement-breakpoint
CREATE TYPE "public"."move_status" AS ENUM('planning', 'active', 'moving_day', 'settling', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."move_type" AS ENUM('local', 'long_distance', 'interstate');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('free', 'essentials', 'complete', 'premium');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'agent_working', 'awaiting_approval', 'completed', 'skipped', 'overdue');--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"phone" text,
	"nylas_grant_id" text,
	"nylas_email" text,
	"stripe_customer_id" text,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"notification_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"web_push_subscription" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "move_status" DEFAULT 'planning' NOT NULL,
	"origin_address" text,
	"origin_city" text,
	"origin_state" text,
	"origin_zip" text,
	"origin_lat" numeric(10, 7),
	"origin_lng" numeric(10, 7),
	"destination_address" text,
	"destination_city" text,
	"destination_state" text,
	"destination_zip" text,
	"destination_lat" numeric(10, 7),
	"destination_lng" numeric(10, 7),
	"move_date" date NOT NULL,
	"home_size" "home_size" NOT NULL,
	"move_type" "move_type",
	"special_items" text[] DEFAULT '{}' NOT NULL,
	"usage_profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"move_profile_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"task_count" integer DEFAULT 0 NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"complexity_score" integer,
	"plan_tier" "plan_tier" DEFAULT 'free' NOT NULL,
	"stripe_payment_intent" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"move_id" uuid NOT NULL,
	"agent_type" "agent_type" NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"instructions" text,
	"due_date" date,
	"due_days_before" integer,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"depends_on" uuid[] DEFAULT '{}' NOT NULL,
	"completion_notes" text,
	"completed_at" timestamp with time zone,
	"skipped_at" timestamp with time zone,
	"skipped_reason" text,
	"agent_task_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"move_id" uuid NOT NULL,
	"agent_type" "agent_type" NOT NULL,
	"inngest_event_id" text,
	"inngest_run_id" text,
	"status" "agent_task_status" DEFAULT 'queued' NOT NULL,
	"input_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"llm_model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"estimated_cost_usd" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"move_id" uuid NOT NULL,
	"agent_task_id" uuid,
	"agent_type" "agent_type" NOT NULL,
	"status" "approval_status" DEFAULT 'awaiting_approval' NOT NULL,
	"priority" "approval_priority" DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"output_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"requires_email_send" boolean DEFAULT false NOT NULL,
	"email_to" text,
	"email_subject" text,
	"email_body" text,
	"email_thread_id" text,
	"email_sent_at" timestamp with time zone,
	"affiliate_type" text,
	"affiliate_pick_id" text,
	"affiliate_link" text,
	"affiliate_clicked" boolean DEFAULT false NOT NULL,
	"user_edits" jsonb,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_move_id_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."moves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_move_id_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."moves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_items" ADD CONSTRAINT "approval_items_move_id_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."moves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_items" ADD CONSTRAINT "approval_items_agent_task_id_agent_tasks_id_fk" FOREIGN KEY ("agent_task_id") REFERENCES "public"."agent_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_moves_user_id" ON "moves" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_moves_move_date" ON "moves" USING btree ("move_date");--> statement-breakpoint
CREATE INDEX "idx_moves_status" ON "moves" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_move_id" ON "tasks" USING btree ("move_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_agent_tasks_move_id" ON "agent_tasks" USING btree ("move_id");--> statement-breakpoint
CREATE INDEX "idx_agent_tasks_status" ON "agent_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_agent_tasks_run_id" ON "agent_tasks" USING btree ("inngest_run_id");--> statement-breakpoint
CREATE INDEX "idx_approval_items_move_id" ON "approval_items" USING btree ("move_id");--> statement-breakpoint
CREATE INDEX "idx_approval_items_status" ON "approval_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_approval_items_agent_task_id" ON "approval_items" USING btree ("agent_task_id");