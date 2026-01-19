import { db } from "@/lib/db";
import { lines, scenes, characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessScript } from "@/lib/scripts/access";
import { getScript } from "@/lib/scripts/service";

/**
 * Create a new line in a scene
 * @param text - The dialogue text content
 * @param sceneId - The scene ID to create the line in
 * @param userId - The user ID creating the line
 * @param characterId - Optional character ID who speaks this line
 * @returns The created line
 * @throws Error if scene not found, character not found (when provided), character/scene don't belong to same script, or user does not have access
 */
export async function createLine(
  text: string,
  sceneId: string,
  userId: string,
  characterId?: string
) {
  // Get scene to verify it exists and check access
  const [scene] = await db
    .select()
    .from(scenes)
    .where(eq(scenes.id, sceneId))
    .limit(1);

  if (!scene) {
    throw new Error("Scene not found");
  }

  // Get script to verify access
  const script = await getScript(scene.scriptId);
  if (!script) {
    throw new Error("Script not found");
  }

  // Verify access to script
  if (!(await canAccessScript(userId, script))) {
    throw new Error("You do not have access to this scene's script");
  }

  // If characterId is provided, validate it belongs to same script
  if (characterId) {
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!character) {
      throw new Error("Character not found");
    }

    // Verify character and scene belong to same script
    if (character.scriptId !== scene.scriptId) {
      throw new Error("Character and scene must belong to the same script");
    }
  }

  // Create line
  const [line] = await db
    .insert(lines)
    .values({
      text,
      characterId: characterId || null,
      sceneId,
    })
    .returning();

  return line;
}

/**
 * Get all lines for a scene
 * @param sceneId - The scene ID to get lines for
 * @param userId - The user ID requesting the lines
 * @returns Array of lines for the scene
 * @throws Error if scene not found or user does not have access
 */
export async function getLinesByScene(sceneId: string, userId: string) {
  // Get scene to verify it exists and check access
  const [scene] = await db
    .select()
    .from(scenes)
    .where(eq(scenes.id, sceneId))
    .limit(1);

  if (!scene) {
    throw new Error("Scene not found");
  }

  // Get script to verify access
  const script = await getScript(scene.scriptId);
  if (!script) {
    throw new Error("Script not found");
  }

  // Verify access to script
  if (!(await canAccessScript(userId, script))) {
    throw new Error("You do not have access to this scene's script");
  }

  // Get lines for scene
  return db.select().from(lines).where(eq(lines.sceneId, sceneId));
}

