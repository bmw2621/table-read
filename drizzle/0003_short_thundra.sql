CREATE TABLE "character" (
	"id" text PRIMARY KEY NOT NULL,
	"scriptId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"characterId" text,
	"sceneId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scene" (
	"id" text PRIMARY KEY NOT NULL,
	"scriptId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_scriptId_script_id_fk" FOREIGN KEY ("scriptId") REFERENCES "public"."script"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line" ADD CONSTRAINT "line_characterId_character_id_fk" FOREIGN KEY ("characterId") REFERENCES "public"."character"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line" ADD CONSTRAINT "line_sceneId_scene_id_fk" FOREIGN KEY ("sceneId") REFERENCES "public"."scene"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene" ADD CONSTRAINT "scene_scriptId_script_id_fk" FOREIGN KEY ("scriptId") REFERENCES "public"."script"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "character_scriptId_idx" ON "character" USING btree ("scriptId");--> statement-breakpoint
CREATE INDEX "line_sceneId_idx" ON "line" USING btree ("sceneId");--> statement-breakpoint
CREATE INDEX "line_characterId_idx" ON "line" USING btree ("characterId");--> statement-breakpoint
CREATE INDEX "scene_scriptId_idx" ON "scene" USING btree ("scriptId");