import { db } from "@/lib/db";
import { troupes, troupeMemberships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canManageTroupe, isDirector } from "./permissions";

/**
 * Create a new troupe with the specified user as director
 * The director is automatically added as the first member
 * @param directorId - The user ID who will be the director
 * @returns The created troupe
 */
export async function createTroupe(directorId: string) {
  // Create troupe
  const [troupe] = await db
    .insert(troupes)
    .values({
      directorId,
    })
    .returning();

  // Add director as first member
  await db.insert(troupeMemberships).values({
    userId: directorId,
    troupeId: troupe.id,
  });

  return troupe;
}

/**
 * Approve a user to join a troupe (director only)
 * @param troupeId - The troupe ID
 * @param userId - The user ID to approve
 * @param directorId - The director ID (for permission check)
 * @returns The created membership
 * @throws Error if user is not director, user is already a member, or validation fails
 */
export async function approveMember(
  troupeId: string,
  userId: string,
  directorId: string
) {
  // Check director permission
  if (!(await canManageTroupe(directorId, troupeId))) {
    throw new Error("Only the director can approve members");
  }

  // Check for duplicate membership
  const existing = await db
    .select()
    .from(troupeMemberships)
    .where(
      and(
        eq(troupeMemberships.userId, userId),
        eq(troupeMemberships.troupeId, troupeId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("User is already a member");
  }

  // Create membership
  const [membership] = await db
    .insert(troupeMemberships)
    .values({
      userId,
      troupeId,
    })
    .returning();

  return membership;
}

/**
 * Remove a member from a troupe
 * - Users can remove themselves from any troupe (unless they are the director)
 * - Directors can remove other members
 * - Directors cannot remove themselves
 * @param troupeId - The troupe ID
 * @param targetUserId - The user ID to remove
 * @param requestingUserId - The user ID making the request (for permission check)
 * @throws Error if user is not director and trying to remove someone else, or if director tries to remove themselves
 */
export async function removeMember(
  troupeId: string,
  targetUserId: string,
  requestingUserId: string
) {
  const isUserDirector = await isDirector(requestingUserId, troupeId);
  const isUserManager = await canManageTroupe(requestingUserId, troupeId);
  const isUserDeletingSelf = targetUserId === requestingUserId;
  
  // Check if user is trying to remove themselves
  if (isUserDeletingSelf && isUserDirector) {
    throw new Error("Director cannot remove themselves");
  }
  
  // Removing someone else requires director permission
  if (!isUserManager && !isUserDeletingSelf) {
    throw new Error("Only a troupe manager can remove members");
  }

  // Remove membership
  await db
    .delete(troupeMemberships)
    .where(
      and(
        eq(troupeMemberships.userId, targetUserId),
        eq(troupeMemberships.troupeId, troupeId)
      )
    );
}

/**
 * Delete a troupe (director only)
 * Cascades to memberships and troupe-owned scripts
 * @param troupeId - The troupe ID to delete
 * @param directorId - The director ID (for permission check)
 * @throws Error if user is not director
 */
export async function deleteTroupe(troupeId: string, directorId: string) {
  // Check director permission
  if (!(await isDirector(directorId, troupeId))) {
    throw new Error("Only the director can delete a troupe");
  }

  // Delete troupe (cascades to memberships via foreign key)
  await db.delete(troupes).where(eq(troupes.id, troupeId));
}

