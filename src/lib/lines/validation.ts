import { z } from "zod";

/**
 * Schema for creating a line
 * Line belongs to a scene (sceneId from path parameter)
 * Character is optional (characterId from request body)
 */
export const createLineSchema = z.object({
  text: z.string().min(1, "Text is required"),
  characterId: z.string().min(1, "Character ID is required").optional(),
  sceneId: z.string().min(1, "Scene ID is required"),
});

export type CreateLineInput = z.infer<typeof createLineSchema>;

