CREATE TYPE "public"."affiliate_category" AS ENUM('isp', 'utility', 'insurance', 'storage', 'home_service');--> statement-breakpoint
CREATE TABLE "affiliate_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"move_id" uuid,
	"approval_item_id" uuid,
	"category" "affiliate_category" NOT NULL,
	"offer_id" text NOT NULL,
	"provider" text NOT NULL,
	"network" text NOT NULL,
	"destination_url" text NOT NULL,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"converted_at" timestamp with time zone,
	"commission_usd" numeric(10, 2),
	"conversion_ref" text
);
--> statement-breakpoint
ALTER TABLE "affiliate_events" ADD CONSTRAINT "affiliate_events_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_events" ADD CONSTRAINT "affiliate_events_move_id_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."moves"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_events" ADD CONSTRAINT "affiliate_events_approval_item_id_approval_items_id_fk" FOREIGN KEY ("approval_item_id") REFERENCES "public"."approval_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_affiliate_events_user_id" ON "affiliate_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_affiliate_events_move_id" ON "affiliate_events" USING btree ("move_id");--> statement-breakpoint
CREATE INDEX "idx_affiliate_events_offer_id" ON "affiliate_events" USING btree ("offer_id");