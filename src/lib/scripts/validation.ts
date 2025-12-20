import { z } from "zod";

/**
 * Schema for creating a script
 * Script can be owned by user (if troupeId not provided) or troupe (if troupeId provided)
 */
export const createScriptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  troupeId: z.string().optional(),
});

export type CreateScriptInput = z.infer<typeof createScriptSchema>;

/**
 * Schema for updating a script
 */
export const updateScriptSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export type UpdateScriptInput = z.infer<typeof updateScriptSchema>;

