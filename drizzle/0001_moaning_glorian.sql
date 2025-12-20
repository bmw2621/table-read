CREATE TABLE "script" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"userId" text,
	"troupeId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "troupeMembership" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"troupeId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "troupe" (
	"id" text PRIMARY KEY NOT NULL,
	"directorId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "script" ADD CONSTRAINT "script_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script" ADD CONSTRAINT "script_troupeId_troupe_id_fk" FOREIGN KEY ("troupeId") REFERENCES "public"."troupe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "troupeMembership" ADD CONSTRAINT "troupeMembership_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "troupeMembership" ADD CONSTRAINT "troupeMembership_troupeId_troupe_id_fk" FOREIGN KEY ("troupeId") REFERENCES "public"."troupe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "troupe" ADD CONSTRAINT "troupe_directorId_user_id_fk" FOREIGN KEY ("directorId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "script_userId_idx" ON "script" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "script_troupeId_idx" ON "script" USING btree ("troupeId");--> statement-breakpoint
CREATE INDEX "troupeMembership_userId_idx" ON "troupeMembership" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "troupeMembership_troupeId_idx" ON "troupeMembership" USING btree ("troupeId");--> statement-breakpoint
CREATE UNIQUE INDEX "troupeMembership_userId_troupeId_idx" ON "troupeMembership" USING btree ("userId","troupeId");--> statement-breakpoint
CREATE INDEX "troupe_directorId_idx" ON "troupe" USING btree ("directorId");