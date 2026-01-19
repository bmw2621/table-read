import { db } from "@/lib/db";
import { scenes } from "@/lib/db/schema";
import { canAccessScript } from "@/lib/scripts/access";
import { getScript } from "@/lib/scripts/service";
import { eq } from "drizzle-orm";

/**
 * Create a new scene in a script
 * @param scriptId - The script ID to create the scene in
 * @param userId - The user ID creating the scene
 * @returns The created scene
 * @throws Error if script not found or user does not have access
 */
export async function createScene(scriptId: string, userId: string) {
  // Get script to verify it exists and check access
  const script = await getScript(scriptId);
  if (!script) {
    throw new Error("Script not found");
  }

  // Verify access to script
  if (!(await canAccessScript(userId, script))) {
    throw new Error("You do not have access to this script");
  }

  // Create scene
  const [scene] = await db
    .insert(scenes)
    .values({
      scriptId,
    })
    .returning();

  return scene;
}

/**
 * Get all scenes for a script
 * @param scriptId - The script ID to get scenes for
 * @param userId - The user ID requesting the scenes
 * @returns Array of scenes for the script
 * @throws Error if script not found or user does not have access
 */
export async function getScenesByScript(scriptId: string, userId: string) {
  // Get script to verify it exists and check access
  const script = await getScript(scriptId);
  if (!script) {
    throw new Error("Script not found");
  }

  // Verify access to script
  if (!(await canAccessScript(userId, script))) {
    throw new Error("You do not have access to this script");
  }

  // Get scenes for script
  return db.select().from(scenes).where(eq(scenes.scriptId, scriptId));
}
