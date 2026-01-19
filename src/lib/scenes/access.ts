import { db } from "@/lib/db";
import { scenes } from "@/lib/db/schema";
import { canAccessScript } from "@/lib/scripts/access";
import { getScript } from "@/lib/scripts/service";
import { eq } from "drizzle-orm";

/**
 * Check if a user can access a scene
 * Scene access inherits from script access - if user can access script, they can access its scenes
 * @param sceneId - The scene ID to check
 * @param userId - The user ID to check
 * @returns true if user has access, false otherwise
 */
export async function canAccessScene(
  sceneId: string,
  userId: string
): Promise<boolean> {
  // Get scene to find its script
  const [scene] = await db
    .select()
    .from(scenes)
    .where(eq(scenes.id, sceneId))
    .limit(1);

  if (!scene) {
    return false;
  }

  // Get script to check access
  const script = await getScript(scene.scriptId);
  if (!script) {
    return false;
  }

  // Scene access inherits from script access
  return canAccessScript(userId, script);
}
