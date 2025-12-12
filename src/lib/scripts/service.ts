import { db } from "@/lib/db";
import { scripts, troupeMemberships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Create a new script
 * Script can be owned by a user (personal) or a troupe (shared)
 * @param params - Script creation parameters
 * @param params.title - Script title (required, non-empty)
 * @param params.userId - User ID creating the script
 * @param params.troupeId - Optional troupe ID (if provided, script owned by troupe)
 * @returns The created script
 * @throws Error if title is empty, or if troupeId provided but user is not a member
 */
export async function createScript(params: {
  title: string;
  userId: string;
  troupeId?: string;
}) {
  // Validate title
  if (!params.title || params.title.trim().length === 0) {
    throw new Error("Title is required");
  }

  // If troupeId is provided, verify user is a member
  if (params.troupeId) {
    const membership = await db
      .select()
      .from(troupeMemberships)
      .where(
        and(
          eq(troupeMemberships.userId, params.userId),
          eq(troupeMemberships.troupeId, params.troupeId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      throw new Error("You are not a member of this troupe");
    }
  }

  // Create script with appropriate ownership
  const [script] = await db
    .insert(scripts)
    .values({
      title: params.title.trim(),
      userId: params.troupeId ? null : params.userId,
      troupeId: params.troupeId || null,
    })
    .returning();

  return script;
}
