import { createScript } from "@/lib/scripts/service";
import { createTroupe, approveMember, removeMember } from "@/lib/troupes/service";
import { canAccessScript } from "@/lib/scripts/access";
import { db } from "@/lib/db";
import { scripts, troupes, troupeMemberships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("E2E: Access Control Flow", () => {
  let testDirectorId: string;
  let testMemberId: string;
  let testNonMemberId: string;
  let testTroupeId: string;
  let testTroupeScriptId: string;

  beforeAll(async () => {
    // Create test users
    const [director] = await db
      .insert(users)
      .values({
        username: `e2e-director-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testDirectorId = director.id;

    const [member] = await db
      .insert(users)
      .values({
        username: `e2e-member-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testMemberId = member.id;

    const [nonMember] = await db
      .insert(users)
      .values({
        username: `e2e-nonmember-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testNonMemberId = nonMember.id;

    // Create a troupe
    const troupe = await createTroupe(testDirectorId);
    testTroupeId = troupe.id;

    // Add member to troupe
    await approveMember(testTroupeId, testMemberId, testDirectorId);

    // Create a troupe-owned script
    const troupeScript = await createScript({
      title: "Troupe Access Test Script",
      userId: testDirectorId,
      troupeId: testTroupeId,
    });
    testTroupeScriptId = troupeScript.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testTroupeScriptId) {
      await db.delete(scripts).where(eq(scripts.id, testTroupeScriptId));
    }
    if (testTroupeId) {
      await db.delete(troupeMemberships).where(eq(troupeMemberships.troupeId, testTroupeId));
      await db.delete(troupes).where(eq(troupes.id, testTroupeId));
    }
    if (testDirectorId) {
      await db.delete(users).where(eq(users.id, testDirectorId));
    }
    if (testMemberId) {
      await db.delete(users).where(eq(users.id, testMemberId));
    }
    if (testNonMemberId) {
      await db.delete(users).where(eq(users.id, testNonMemberId));
    }
  });

  it("should allow troupe members to access troupe-owned scripts", async () => {
    // Step 1: Get the troupe script
    const [troupeScript] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, testTroupeScriptId))
      .limit(1);

    expect(troupeScript).toBeDefined();

    // Step 2: Verify director can access the script
    const directorHasAccess = await canAccessScript(testDirectorId, troupeScript!);
    expect(directorHasAccess).toBe(true);

    // Step 3: Verify troupe member can access the script
    const memberHasAccess = await canAccessScript(testMemberId, troupeScript!);
    expect(memberHasAccess).toBe(true);
  });

  it("should deny access to non-members for troupe-owned scripts", async () => {
    // Step 1: Get the troupe script
    const [troupeScript] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, testTroupeScriptId))
      .limit(1);

    expect(troupeScript).toBeDefined();

    // Step 2: Verify non-member cannot access the script
    const nonMemberHasAccess = await canAccessScript(testNonMemberId, troupeScript!);
    expect(nonMemberHasAccess).toBe(false);
  });

  it("should revoke access when user leaves troupe", async () => {
    // Step 1: Verify member has access before leaving
    const [troupeScript] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, testTroupeScriptId))
      .limit(1);

    const hasAccessBefore = await canAccessScript(testMemberId, troupeScript!);
    expect(hasAccessBefore).toBe(true);

    // Step 2: Remove member from troupe
    await removeMember(testTroupeId, testMemberId, testDirectorId);

    // Step 3: Verify member no longer has access
    const hasAccessAfter = await canAccessScript(testMemberId, troupeScript!);
    expect(hasAccessAfter).toBe(false);

    // Step 4: Verify membership was removed
    const members = await db
      .select()
      .from(troupeMemberships)
      .where(eq(troupeMemberships.troupeId, testTroupeId));

    const memberStillExists = members.some((m) => m.userId === testMemberId);
    expect(memberStillExists).toBe(false);
  });
});

