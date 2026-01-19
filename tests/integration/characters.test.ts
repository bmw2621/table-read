import { createCharacter, getCharactersByScript } from "@/lib/characters/service";
import { createScript } from "@/lib/scripts/service";
import { db } from "@/lib/db";
import { characters, scripts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Character CRUD Operations", () => {
  let testUserId: string;
  let testScriptId: string;
  let testCharacterId: string;

  beforeAll(async () => {
    // Create test user
    const [testUser] = await db
      .insert(users)
      .values({
        username: `test-user-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testUserId = testUser.id;

    // Create a test script
    const script = await createScript({
      title: "Character Test Script",
      userId: testUserId,
    });
    testScriptId = script.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testCharacterId) {
      await db.delete(characters).where(eq(characters.id, testCharacterId));
    }
    if (testScriptId) {
      await db.delete(scripts).where(eq(scripts.id, testScriptId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("createCharacter", () => {
    it("should create a character for a script when user has access", async () => {
      const character = await createCharacter(testScriptId, testUserId);
      testCharacterId = character.id;

      expect(character.scriptId).toBe(testScriptId);
      expect(character.id).toBeDefined();
      expect(character.createdAt).toBeDefined();
      expect(character.updatedAt).toBeDefined();

      // Verify character exists in database
      const [dbCharacter] = await db
        .select()
        .from(characters)
        .where(eq(characters.id, character.id))
        .limit(1);

      expect(dbCharacter).toBeDefined();
      expect(dbCharacter?.scriptId).toBe(testScriptId);
    });

    it("should create multiple characters for the same script", async () => {
      const character1 = await createCharacter(testScriptId, testUserId);
      const character2 = await createCharacter(testScriptId, testUserId);

      expect(character1.id).not.toBe(character2.id);
      expect(character1.scriptId).toBe(testScriptId);
      expect(character2.scriptId).toBe(testScriptId);

      // Cleanup
      await db.delete(characters).where(eq(characters.id, character1.id));
      await db.delete(characters).where(eq(characters.id, character2.id));
    });
  });

  describe("getCharactersByScript", () => {
    it("should return all characters for a script", async () => {
      // Create multiple characters
      const character1 = await createCharacter(testScriptId, testUserId);
      const character2 = await createCharacter(testScriptId, testUserId);
      const character3 = await createCharacter(testScriptId, testUserId);

      const result = await getCharactersByScript(testScriptId, testUserId);

      expect(result.length).toBeGreaterThanOrEqual(3);
      const characterIds = result.map((c) => c.id);
      expect(characterIds).toContain(character1.id);
      expect(characterIds).toContain(character2.id);
      expect(characterIds).toContain(character3.id);

      // Cleanup
      await db.delete(characters).where(eq(characters.id, character1.id));
      await db.delete(characters).where(eq(characters.id, character2.id));
      await db.delete(characters).where(eq(characters.id, character3.id));
    });

    it("should return empty array when script has no characters", async () => {
      // Create a new script with no characters
      const newScript = await createScript({
        title: "Empty Script",
        userId: testUserId,
      });

      const result = await getCharactersByScript(newScript.id, testUserId);

      expect(result).toEqual([]);

      // Cleanup
      await db.delete(scripts).where(eq(scripts.id, newScript.id));
    });
  });

  describe("Access Control", () => {
    it("should prevent creating character when user does not have access to script", async () => {
      // Create another user and script
      const [otherUser] = await db
        .insert(users)
        .values({
          username: `other-user-${Date.now()}`,
          password: "hashed-password",
        })
        .returning();

      const otherScript = await createScript({
        title: "Other User Script",
        userId: otherUser.id,
      });

      // Try to create character for script user doesn't have access to
      await expect(
        createCharacter(otherScript.id, testUserId)
      ).rejects.toThrow("You do not have access to this script");

      // Cleanup
      await db.delete(scripts).where(eq(scripts.id, otherScript.id));
      await db.delete(users).where(eq(users.id, otherUser.id));
    });

    it("should prevent listing characters when user does not have access to script", async () => {
      // Create another user and script
      const [otherUser] = await db
        .insert(users)
        .values({
          username: `other-user-${Date.now()}`,
          password: "hashed-password",
        })
        .returning();

      const otherScript = await createScript({
        title: "Other User Script",
        userId: otherUser.id,
      });

      // Try to get characters for script user doesn't have access to
      await expect(
        getCharactersByScript(otherScript.id, testUserId)
      ).rejects.toThrow("You do not have access to this script");

      // Cleanup
      await db.delete(scripts).where(eq(scripts.id, otherScript.id));
      await db.delete(users).where(eq(users.id, otherUser.id));
    });
  });
});

