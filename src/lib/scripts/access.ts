import { db } from "@/lib/db";
import { Script } from "@/lib/typedefs";
import { troupeMemberships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Check if a user can access a script
 * - User-owned scripts: Accessible only to the owning user
 * - Troupe-owned scripts: Accessible to all members of the troupe
 * @param userId - The user ID to check
 * @param script - The script to check access for
 * @returns true if user has access, false otherwise
 */
export async function canAccessScript(
  userId: string,
  script: Script
): Promise<boolean> {
  // User-owned script: check if user is the owner
  if (script.userId === userId) {
    return true;
  }

  // Troupe-owned script: check if user is a member of the troupe
  if (script.troupeId) {
    const membership = await db
      .select()
      .from(troupeMemberships)
      .where(
        and(
          eq(troupeMemberships.userId, userId),
          eq(troupeMemberships.troupeId, script.troupeId)
        )
      )
      .limit(1);

    return membership.length > 0;
  }

  // Script has no owner (edge case)
  return false;
}
