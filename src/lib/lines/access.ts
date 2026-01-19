import { canAccessScene } from "@/lib/scenes/access";
import { db } from "@/lib/db";
import { lines } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if a user can access a line
 * Line access inherits from scene access - if user can access scene, they can access its lines
 * @param lineId - The line ID to check
 * @param userId - The user ID to check
 * @returns true if user has access, false otherwise
 */
export async function canAccessLine(
  lineId: string,
  userId: string
): Promise<boolean> {
  // Get line to find its scene
  const [line] = await db
    .select()
    .from(lines)
    .where(eq(lines.id, lineId))
    .limit(1);

  if (!line) {
    return false;
  }

  // Line access inherits from scene access
  return canAccessScene(line.sceneId, userId);
}

