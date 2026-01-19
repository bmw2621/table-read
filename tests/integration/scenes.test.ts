import { db } from "@/lib/db";
import { scenes, scripts, users } from "@/lib/db/schema";
import { createScene, getScenesByScript } from "@/lib/scenes/service";
import { createScript } from "@/lib/scripts/service";
import { eq } from "drizzle-orm";

describe("Scene CRUD Operations", () => {
  let testUserId: string;
  let testScriptId: string;
  let testSceneId: string;

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
      title: "Scene Test Script",
      userId: testUserId,
    });
    testScriptId = script.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testSceneId) {
      await db.delete(scenes).where(eq(scenes.id, testSceneId));
    }
    if (testScriptId) {
      await db.delete(scripts).where(eq(scripts.id, testScriptId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("createScene", () => {
    it("should create a scene for a script when user has access", async () => {
      const scene = await createScene(testScriptId, testUserId);
      testSceneId = scene.id;

      expect(scene.scriptId).toBe(testScriptId);
      expect(scene.id).toBeDefined();
      expect(scene.createdAt).toBeDefined();
      expect(scene.updatedAt).toBeDefined();

      // Verify scene exists in database
      const [dbScene] = await db
        .select()
        .from(scenes)
        .where(eq(scenes.id, scene.id))
        .limit(1);

      expect(dbScene).toBeDefined();
      expect(dbScene?.scriptId).toBe(testScriptId);
    });

    it("should create multiple scenes for the same script", async () => {
      const scene1 = await createScene(testScriptId, testUserId);
      const scene2 = await createScene(testScriptId, testUserId);

      expect(scene1.id).not.toBe(scene2.id);
      expect(scene1.scriptId).toBe(testScriptId);
      expect(scene2.scriptId).toBe(testScriptId);

      // Cleanup
      await db.delete(scenes).where(eq(scenes.id, scene1.id));
      await db.delete(scenes).where(eq(scenes.id, scene2.id));
    });
  });

  describe("getScenesByScript", () => {
    it("should return all scenes for a script", async () => {
      // Create multiple scenes
      const scene1 = await createScene(testScriptId, testUserId);
      const scene2 = await createScene(testScriptId, testUserId);
      const scene3 = await createScene(testScriptId, testUserId);

      const result = await getScenesByScript(testScriptId, testUserId);

      expect(result.length).toBeGreaterThanOrEqual(3);
      const sceneIds = result.map((s) => s.id);
      expect(sceneIds).toContain(scene1.id);
      expect(sceneIds).toContain(scene2.id);
      expect(sceneIds).toContain(scene3.id);

      // Cleanup
      await db.delete(scenes).where(eq(scenes.id, scene1.id));
      await db.delete(scenes).where(eq(scenes.id, scene2.id));
      await db.delete(scenes).where(eq(scenes.id, scene3.id));
    });

    it("should return empty array when script has no scenes", async () => {
      // Create a new script with no scenes
      const newScript = await createScript({
        title: "Empty Script",
        userId: testUserId,
      });

      const result = await getScenesByScript(newScript.id, testUserId);

      expect(result).toEqual([]);

      // Cleanup
      await db.delete(scripts).where(eq(scripts.id, newScript.id));
    });
  });

  describe("Access Control", () => {
    it("should prevent creating scene when user does not have access to script", async () => {
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

      // Try to create scene for script user doesn't have access to
      await expect(createScene(otherScript.id, testUserId)).rejects.toThrow(
        "You do not have access to this script"
      );

      // Cleanup
      await db.delete(scripts).where(eq(scripts.id, otherScript.id));
      await db.delete(users).where(eq(users.id, otherUser.id));
    });

    it("should prevent listing scenes when user does not have access to script", async () => {
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

      // Try to get scenes for script user doesn't have access to
      await expect(
        getScenesByScript(otherScript.id, testUserId)
      ).rejects.toThrow("You do not have access to this script");

      // Cleanup
      await db.delete(scripts).where(eq(scripts.id, otherScript.id));
      await db.delete(users).where(eq(users.id, otherUser.id));
    });
  });
});
