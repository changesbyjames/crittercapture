DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('pending', 'processing', 'complete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "images" SET DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "images" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "start_capture_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "end_capture_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "status" "status" DEFAULT 'pending' NOT NULL;