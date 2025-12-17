import { createTroupe, approveMember, removeMember } from "@/lib/troupes/service";
import { isDirector } from "@/lib/troupes/permissions";
import { db } from "@/lib/db";
import { troupes, troupeMemberships, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

describe("E2E: Membership Management Flow", () => {
  let testDirectorId: string;
  let testMemberId: string;
  let testNonDirectorId: string;
  let testTroupeId: string;

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

    const [nonDirector] = await db
      .insert(users)
      .values({
        username: `e2e-nondirector-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testNonDirectorId = nonDirector.id;

    // Create a troupe
    const troupe = await createTroupe(testDirectorId);
    testTroupeId = troupe.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
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
    if (testNonDirectorId) {
      await db.delete(users).where(eq(users.id, testNonDirectorId));
    }
  });

  it("should allow director to approve new members", async () => {
    // Step 1: Director approves a new member
    const membership = await approveMember(testTroupeId, testMemberId, testDirectorId);

    // Step 2: Verify membership was created
    expect(membership).toBeDefined();
    expect(membership.userId).toBe(testMemberId);
    expect(membership.troupeId).toBe(testTroupeId);

    // Step 3: Verify membership exists in database
    const [dbMembership] = await db
      .select()
      .from(troupeMemberships)
      .where(
        and(
          eq(troupeMemberships.userId, testMemberId),
          eq(troupeMemberships.troupeId, testTroupeId)
        )
      )
      .limit(1);

    expect(dbMembership).toBeDefined();
  });

  it("should allow director to remove members", async () => {
    // Step 1: Verify member exists
    const membersBefore = await db
      .select()
      .from(troupeMemberships)
      .where(eq(troupeMemberships.troupeId, testTroupeId));

    const memberExists = membersBefore.some((m) => m.userId === testMemberId);
    expect(memberExists).toBe(true);

    // Step 2: Director removes the member
    await removeMember(testTroupeId, testMemberId, testDirectorId);

    // Step 3: Verify member was removed
    const membersAfter = await db
      .select()
      .from(troupeMemberships)
      .where(eq(troupeMemberships.troupeId, testTroupeId));

    const memberStillExists = membersAfter.some((m) => m.userId === testMemberId);
    expect(memberStillExists).toBe(false);
  });

  it("should block non-director from approving members", async () => {
    // Step 1: Non-director tries to approve a member
    await expect(
      approveMember(testTroupeId, testNonDirectorId, testNonDirectorId)
    ).rejects.toThrow("Only the director can approve members");

    // Step 2: Verify membership was not created
    const members = await db
      .select()
      .from(troupeMemberships)
      .where(eq(troupeMemberships.troupeId, testTroupeId));

    const nonDirectorIsMember = members.some((m) => m.userId === testNonDirectorId);
    expect(nonDirectorIsMember).toBe(false);
  });

  it("should verify director permissions are correctly assigned", async () => {
    // Step 1: Verify director is the director
    const isUserDirector = await isDirector(testDirectorId, testTroupeId);
    expect(isUserDirector).toBe(true);

    // Step 2: Verify non-director is not the director
    const isNonDirector = await isDirector(testNonDirectorId, testTroupeId);
    expect(isNonDirector).toBe(false);
  });
});

