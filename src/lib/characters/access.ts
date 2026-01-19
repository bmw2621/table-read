import { canAccessScript } from "@/lib/scripts/access";
import { getScript } from "@/lib/scripts/service";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if a user can access a character
 * Character access inherits from script access - if user can access script, they can access its characters
 * @param characterId - The character ID to check
 * @param userId - The user ID to check
 * @returns true if user has access, false otherwise
 */
export async function canAccessCharacter(
  characterId: string,
  userId: string
): Promise<boolean> {
  // Get character to find its script
  const [character] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!character) {
    return false;
  }

  // Get script to check access
  const script = await getScript(character.scriptId);
  if (!script) {
    return false;
  }

  // Character access inherits from script access
  return canAccessScript(userId, script);
}

