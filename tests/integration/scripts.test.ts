import { createScript } from "@/lib/scripts/service";
import { createTroupe, approveMember } from "@/lib/troupes/service";
import { db } from "@/lib/db";
import { scripts, troupes, troupeMemberships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Script CRUD Operations", () => {
  let testUserId: string;
  let testTroupeId: string;
  let testMemberId: string;
  let testScriptId: string;

  beforeAll(async () => {
    // Create test users
    const [testUser] = await db
      .insert(users)
      .values({
        username: `test-user-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testUserId = testUser.id;

    const [testMember] = await db
      .insert(users)
      .values({
        username: `test-member-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testMemberId = testMember.id;

    // Create a test troupe
    const troupe = await createTroupe(testUserId);
    testTroupeId = troupe.id;

    // Add member to troupe
    await approveMember(testTroupeId, testMemberId, testUserId);
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testScriptId) {
      await db.delete(scripts).where(eq(scripts.id, testScriptId));
    }
    if (testTroupeId) {
      await db.delete(troupeMemberships).where(eq(troupeMemberships.troupeId, testTroupeId));
      await db.delete(troupes).where(eq(troupes.id, testTroupeId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (testMemberId) {
      await db.delete(users).where(eq(users.id, testMemberId));
    }
  });

  describe("createScript with user ownership", () => {
    it("should create a script owned by a user", async () => {
      const script = await createScript({
        title: "My Personal Script",
        userId: testUserId,
      });
      testScriptId = script.id;

      expect(script.title).toBe("My Personal Script");
      expect(script.userId).toBe(testUserId);
      expect(script.troupeId).toBeNull();

      // Verify script exists in database
      const [dbScript] = await db
        .select()
        .from(scripts)
        .where(eq(scripts.id, script.id))
        .limit(1);

      expect(dbScript).toBeDefined();
      expect(dbScript?.title).toBe("My Personal Script");
      expect(dbScript?.userId).toBe(testUserId);
      expect(dbScript?.troupeId).toBeNull();
    });
  });

  describe("createScript with troupe ownership", () => {
    it("should create a script owned by a troupe when user is a member", async () => {
      const script = await createScript({
        title: "Troupe Shared Script",
        userId: testUserId,
        troupeId: testTroupeId,
      });

      expect(script.title).toBe("Troupe Shared Script");
      expect(script.userId).toBeNull();
      expect(script.troupeId).toBe(testTroupeId);

      // Verify script exists in database
      const [dbScript] = await db
        .select()
        .from(scripts)
        .where(eq(scripts.id, script.id))
        .limit(1);

      expect(dbScript).toBeDefined();
      expect(dbScript?.title).toBe("Troupe Shared Script");
      expect(dbScript?.userId).toBeNull();
      expect(dbScript?.troupeId).toBe(testTroupeId);

      // Cleanup this script
      await db.delete(scripts).where(eq(scripts.id, script.id));
    });

    it("should allow troupe members to create troupe-owned scripts", async () => {
      const script = await createScript({
        title: "Member Created Script",
        userId: testMemberId,
        troupeId: testTroupeId,
      });

      expect(script.title).toBe("Member Created Script");
      expect(script.userId).toBeNull();
      expect(script.troupeId).toBe(testTroupeId);

      // Cleanup this script
      await db.delete(scripts).where(eq(scripts.id, script.id));
    });

    it("should throw error when non-member tries to create troupe-owned script", async () => {
      // Create a user who is not a member
      const [nonMember] = await db
        .insert(users)
        .values({
          username: `test-nonmember-${Date.now()}`,
          password: "hashed-password",
        })
        .returning();

      await expect(
        createScript({
          title: "Unauthorized Script",
          userId: nonMember.id,
          troupeId: testTroupeId,
        })
      ).rejects.toThrow("You are not a member of this troupe");

      // Cleanup
      await db.delete(users).where(eq(users.id, nonMember.id));
    });
  });
});

