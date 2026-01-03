import { createScript } from "@/lib/scripts/service";
import { createTroupe, approveMember } from "@/lib/troupes/service";
import { canAccessScript } from "@/lib/scripts/access";
import { db } from "@/lib/db";
import { scripts, troupes, troupeMemberships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("E2E: Script Creation and Access Flow", () => {
  let testUserId: string;
  let testMemberId: string;
  let testTroupeId: string;
  let testUserScriptId: string;
  let testTroupeScriptId: string;

  beforeAll(async () => {
    // Create test users
    const [testUser] = await db
      .insert(users)
      .values({
        username: `e2e-user-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testUserId = testUser.id;

    const [testMember] = await db
      .insert(users)
      .values({
        username: `e2e-member-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testMemberId = testMember.id;

    // Create a troupe
    const troupe = await createTroupe(testUserId, "Test Troupe");
    testTroupeId = troupe.id;

    // Add member to troupe
    await approveMember(testTroupeId, testMemberId, testUserId);
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testUserScriptId) {
      await db.delete(scripts).where(eq(scripts.id, testUserScriptId));
    }
    if (testTroupeScriptId) {
      await db.delete(scripts).where(eq(scripts.id, testTroupeScriptId));
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

  it("should allow user to create and access their own script", async () => {
    // Step 1: User creates a personal script
    const userScript = await createScript({
      title: "My Personal Script",
      userId: testUserId,
    });
    testUserScriptId = userScript.id;

    // Step 2: Verify script was created with user ownership
    expect(userScript.userId).toBe(testUserId);
    expect(userScript.troupeId).toBeNull();

    // Step 3: Verify user can access their script
    const hasAccess = await canAccessScript(testUserId, userScript);
    expect(hasAccess).toBe(true);

    // Step 4: Verify script exists in database
    const [dbScript] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, userScript.id))
      .limit(1);

    expect(dbScript).toBeDefined();
    expect(dbScript?.userId).toBe(testUserId);
  });

  it("should allow troupe member to create troupe-owned script and all members can access it", async () => {
    // Step 1: Troupe member creates a troupe-owned script
    const troupeScript = await createScript({
      title: "Troupe Shared Script",
      userId: testMemberId,
      troupeId: testTroupeId,
    });
    testTroupeScriptId = troupeScript.id;

    // Step 2: Verify script was created with troupe ownership
    expect(troupeScript.userId).toBeNull();
    expect(troupeScript.troupeId).toBe(testTroupeId);

    // Step 3: Verify troupe member (creator) can access the script
    const memberHasAccess = await canAccessScript(testMemberId, troupeScript);
    expect(memberHasAccess).toBe(true);

    // Step 4: Verify troupe director can also access the script
    const directorHasAccess = await canAccessScript(testUserId, troupeScript);
    expect(directorHasAccess).toBe(true);

    // Step 5: Verify script exists in database
    const [dbScript] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, troupeScript.id))
      .limit(1);

    expect(dbScript).toBeDefined();
    expect(dbScript?.troupeId).toBe(testTroupeId);
    expect(dbScript?.userId).toBeNull();
  });
});

