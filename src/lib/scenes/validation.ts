import { z } from "zod";

/**
 * Schema for creating a scene
 * Scene belongs to a script (scriptId from path parameter)
 */
export const createSceneSchema = z.object({
  scriptId: z.string().min(1, "Script ID is required"),
});

export type CreateSceneInput = z.infer<typeof createSceneSchema>;
