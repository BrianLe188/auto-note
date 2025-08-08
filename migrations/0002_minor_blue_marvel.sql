ALTER TABLE "action_items" ADD COLUMN "userId" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "userId" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;