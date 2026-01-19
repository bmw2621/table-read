import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessScript } from "@/lib/scripts/access";
import { getScript } from "@/lib/scripts/service";

/**
 * Create a new character in a script
 * @param scriptId - The script ID to create the character in
 * @param userId - The user ID creating the character
 * @returns The created character
 * @throws Error if script not found or user does not have access
 */
export async function createCharacter(scriptId: string, userId: string) {
  // Get script to verify it exists and check access
  const script = await getScript(scriptId);
  if (!script) {
    throw new Error("Script not found");
  }

  // Verify access to script
  if (!(await canAccessScript(userId, script))) {
    throw new Error("You do not have access to this script");
  }

  // Create character
  const [character] = await db
    .insert(characters)
    .values({
      scriptId,
    })
    .returning();

  return character;
}

/**
 * Get all characters for a script
 * @param scriptId - The script ID to get characters for
 * @param userId - The user ID requesting the characters
 * @returns Array of characters for the script
 * @throws Error if script not found or user does not have access
 */
export async function getCharactersByScript(scriptId: string, userId: string) {
  // Get script to verify it exists and check access
  const script = await getScript(scriptId);
  if (!script) {
    throw new Error("Script not found");
  }

  // Verify access to script
  if (!(await canAccessScript(userId, script))) {
    throw new Error("You do not have access to this script");
  }

  // Get characters for script
  return db.select().from(characters).where(eq(characters.scriptId, scriptId));
}

