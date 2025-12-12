import { z } from "zod";

/**
 * Schema for approving a member to join a troupe
 */
export const approveMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type ApproveMemberInput = z.infer<typeof approveMemberSchema>;

