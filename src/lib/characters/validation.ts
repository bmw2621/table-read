import { z } from "zod";

/**
 * Schema for creating a character
 * Character belongs to a script (scriptId from path parameter)
 */
export const createCharacterSchema = z.object({
  scriptId: z.string().min(1, "Script ID is required"),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;

