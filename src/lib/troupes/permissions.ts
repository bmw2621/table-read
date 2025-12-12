import { db } from "@/lib/db";
import { troupes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if a user is the director of a troupe
 * @param userId - The user ID to check
 * @param troupeId - The troupe ID to check
 * @returns true if user is the director, false otherwise
 */
export async function isDirector(userId: string, troupeId: string): Promise<boolean> {
  const troupe = await db
    .select()
    .from(troupes)
    .where(eq(troupes.id, troupeId))
    .limit(1);

  if (troupe.length === 0) {
    return false;
  }

  return troupe[0].directorId === userId;
}

/**
 * Check if a user can manage a troupe (i.e., is the director)
 * @param userId - The user ID to check
 * @param troupeId - The troupe ID to check
 * @returns true if user can manage the troupe, false otherwise
 */
export async function canManageTroupe(userId: string, troupeId: string): Promise<boolean> {
  return isDirector(userId, troupeId);
}

