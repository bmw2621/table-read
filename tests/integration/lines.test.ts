import { createLine, getLinesByScene } from "@/lib/lines/service";
import { createScene } from "@/lib/scenes/service";
import { createCharacter } from "@/lib/characters/service";
import { createScript } from "@/lib/scripts/service";
import { db } from "@/lib/db";
import { lines, scenes, characters, scripts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Line CRUD Operations", () => {
  let testUserId: string;
  let testScriptId: string;
  let testSceneId: string;
  let testCharacterId: string;
  let testLineId: string;

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
      title: "Line Test Script",
      userId: testUserId,
    });
    testScriptId = script.id;

    // Create a test scene
    const scene = await createScene(testScriptId, testUserId);
    testSceneId = scene.id;

    // Create a test character
    const character = await createCharacter(testScriptId, testUserId);
    testCharacterId = character.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testLineId) {
      await db.delete(lines).where(eq(lines.id, testLineId));
    }
    if (testSceneId) {
      await db.delete(scenes).where(eq(scenes.id, testSceneId));
    }
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

  describe("createLine", () => {
    it("should create a line with character when user has access and character/scene belong to same script", async () => {
      const line = await createLine(
        "Hello, world!",
        testSceneId,
        testUserId,
        testCharacterId
      );
      testLineId = line.id;

      expect(line.text).toBe("Hello, world!");
      expect(line.characterId).toBe(testCharacterId);
      expect(line.sceneId).toBe(testSceneId);
      expect(line.id).toBeDefined();
      expect(line.createdAt).toBeDefined();
      expect(line.updatedAt).toBeDefined();

      // Verify line exists in database
      const [dbLine] = await db
        .select()
        .from(lines)
        .where(eq(lines.id, line.id))
        .limit(1);

      expect(dbLine).toBeDefined();
      expect(dbLine?.text).toBe("Hello, world!");
      expect(dbLine?.characterId).toBe(testCharacterId);
      expect(dbLine?.sceneId).toBe(testSceneId);
    });

    it("should create a line without character when characterId is not provided", async () => {
      const line = await createLine("Narrator line", testSceneId, testUserId);

      expect(line.text).toBe("Narrator line");
      expect(line.characterId).toBeNull();
      expect(line.sceneId).toBe(testSceneId);

      // Cleanup
      await db.delete(lines).where(eq(lines.id, line.id));
    });

    it("should create multiple lines for the same scene", async () => {
      const line1 = await createLine(
        "Line 1",
        testSceneId,
        testUserId,
        testCharacterId
      );
      const line2 = await createLine(
        "Line 2",
        testSceneId,
        testUserId,
        testCharacterId
      );

      expect(line1.id).not.toBe(line2.id);
      expect(line1.sceneId).toBe(testSceneId);
      expect(line2.sceneId).toBe(testSceneId);

      // Cleanup
      await db.delete(lines).where(eq(lines.id, line1.id));
      await db.delete(lines).where(eq(lines.id, line2.id));
    });
  });

  describe("getLinesByScene", () => {
    it("should return all lines for a scene", async () => {
      // Create multiple lines
      const line1 = await createLine(
        "Line 1",
        testSceneId,
        testUserId,
        testCharacterId
      );
      const line2 = await createLine(
        "Line 2",
        testSceneId,
        testUserId,
        testCharacterId
      );
      const line3 = await createLine("Line 3", testSceneId, testUserId);

      const result = await getLinesByScene(testSceneId, testUserId);

      expect(result.length).toBeGreaterThanOrEqual(3);
      const lineIds = result.map((l) => l.id);
      expect(lineIds).toContain(line1.id);
      expect(lineIds).toContain(line2.id);
      expect(lineIds).toContain(line3.id);

      // Cleanup
      await db.delete(lines).where(eq(lines.id, line1.id));
      await db.delete(lines).where(eq(lines.id, line2.id));
      await db.delete(lines).where(eq(lines.id, line3.id));
    });

    it("should return empty array when scene has no lines", async () => {
      // Create a new scene with no lines
      const newScene = await createScene(testScriptId, testUserId);

      const result = await getLinesByScene(newScene.id, testUserId);

      expect(result).toEqual([]);

      // Cleanup
      await db.delete(scenes).where(eq(scenes.id, newScene.id));
    });
  });

  describe("Character/Scene Same Script Validation", () => {
    it("should throw error when character and scene belong to different scripts", async () => {
      // Create another script with a character
      const otherScript = await createScript({
        title: "Other Script",
        userId: testUserId,
      });
      const otherCharacter = await createCharacter(otherScript.id, testUserId);

      // Try to create line with character from different script
      await expect(
        createLine("Test line", testSceneId, testUserId, otherCharacter.id)
      ).rejects.toThrow("Character and scene must belong to the same script");

      // Cleanup
      await db.delete(characters).where(eq(characters.id, otherCharacter.id));
      await db.delete(scripts).where(eq(scripts.id, otherScript.id));
    });
  });

  describe("Character Deletion Behavior", () => {
    it("should set characterId to null when character is deleted", async () => {
      // Create a character and line
      const character = await createCharacter(testScriptId, testUserId);
      const line = await createLine(
        "Test line",
        testSceneId,
        testUserId,
        character.id
      );

      // Verify line has character
      expect(line.characterId).toBe(character.id);

      // Delete character (should set characterId to null via foreign key constraint)
      await db.delete(characters).where(eq(characters.id, character.id));

      // Verify line still exists but characterId is null
      const [updatedLine] = await db
        .select()
        .from(lines)
        .where(eq(lines.id, line.id))
        .limit(1);

      expect(updatedLine).toBeDefined();
      expect(updatedLine?.characterId).toBeNull();

      // Cleanup
      await db.delete(lines).where(eq(lines.id, line.id));
    });
  });

  describe("Access Control", () => {
    it("should prevent creating line when user does not have access to script", async () => {
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
      const otherScene = await createScene(otherScript.id, otherUser.id);

      // Try to create line for scene user doesn't have access to
      await expect(
        createLine("Test line", otherScene.id, testUserId)
      ).rejects.toThrow("You do not have access to this scene's script");

      // Cleanup
      await db.delete(scenes).where(eq(scenes.id, otherScene.id));
      await db.delete(scripts).where(eq(scripts.id, otherScript.id));
      await db.delete(users).where(eq(users.id, otherUser.id));
    });

    it("should prevent listing lines when user does not have access to script", async () => {
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
      const otherScene = await createScene(otherScript.id, otherUser.id);

      // Try to get lines for scene user doesn't have access to
      await expect(
        getLinesByScene(otherScene.id, testUserId)
      ).rejects.toThrow("You do not have access to this scene's script");

      // Cleanup
      await db.delete(scenes).where(eq(scenes.id, otherScene.id));
      await db.delete(scripts).where(eq(scripts.id, otherScript.id));
      await db.delete(users).where(eq(users.id, otherUser.id));
    });
  });
});

