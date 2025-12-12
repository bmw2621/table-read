import { createTroupe, approveMember, removeMember } from "@/lib/troupes/service";
import { db } from "@/lib/db";
import { troupes, troupeMemberships, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

describe("Membership Management", () => {
  let testDirectorId: string;
  let testMemberId: string;
  let testTroupeId: string;

  beforeAll(async () => {
    // Create test users
    const [director] = await db
      .insert(users)
      .values({
        username: `test-director-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testDirectorId = director.id;

    const [member] = await db
      .insert(users)
      .values({
        username: `test-member-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testMemberId = member.id;

    // Create test troupe
    const troupe = await createTroupe(testDirectorId);
    testTroupeId = troupe.id;
  });

  afterAll(async () => {
    // Cleanup
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
  });

  describe("approveMember", () => {
    it("should approve member when director calls it", async () => {
      const membership = await approveMember(testTroupeId, testMemberId, testDirectorId);

      expect(membership.userId).toBe(testMemberId);
      expect(membership.troupeId).toBe(testTroupeId);

      // Verify membership exists in database
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

    it("should prevent duplicate memberships", async () => {
      await expect(
        approveMember(testTroupeId, testMemberId, testDirectorId)
      ).rejects.toThrow("User is already a member");
    });

    it("should prevent non-director from approving", async () => {
      const [nonDirector] = await db
        .insert(users)
        .values({
          username: `test-non-director-${Date.now()}`,
          password: "hashed-password",
        })
        .returning();

      await expect(
        approveMember(testTroupeId, testMemberId, nonDirector.id)
      ).rejects.toThrow("Only the director can approve members");

      // Cleanup
      await db.delete(users).where(eq(users.id, nonDirector.id));
    });
  });

  describe("removeMember", () => {
    it("should remove member when director calls it", async () => {
      // First add a member to remove
      const [newMember] = await db
        .insert(users)
        .values({
          username: `test-member-to-remove-${Date.now()}`,
          password: "hashed-password",
        })
        .returning();

      await approveMember(testTroupeId, newMember.id, testDirectorId);

      // Now remove them (director removing someone else)
      await removeMember(testTroupeId, newMember.id, testDirectorId);

      // Verify membership is removed
      const [membership] = await db
        .select()
        .from(troupeMemberships)
        .where(
          and(
            eq(troupeMemberships.userId, newMember.id),
            eq(troupeMemberships.troupeId, testTroupeId)
          )
        )
        .limit(1);

      expect(membership).toBeUndefined();

      // Cleanup
      await db.delete(users).where(eq(users.id, newMember.id));
    });

    it("should allow user to remove themselves", async () => {
      // Add a member
      const [selfRemovingMember] = await db
        .insert(users)
        .values({
          username: `test-self-remove-${Date.now()}`,
          password: "hashed-password",
        })
        .returning();

      await approveMember(testTroupeId, selfRemovingMember.id, testDirectorId);

      // User removes themselves
      await removeMember(testTroupeId, selfRemovingMember.id, selfRemovingMember.id);

      // Verify membership is removed
      const [membership] = await db
        .select()
        .from(troupeMemberships)
        .where(
          and(
            eq(troupeMemberships.userId, selfRemovingMember.id),
            eq(troupeMemberships.troupeId, testTroupeId)
          )
        )
        .limit(1);

      expect(membership).toBeUndefined();

      // Cleanup
      await db.delete(users).where(eq(users.id, selfRemovingMember.id));
    });

    it("should prevent director from removing themselves", async () => {
      await expect(
        removeMember(testTroupeId, testDirectorId, testDirectorId)
      ).rejects.toThrow("Director cannot remove themselves");
    });

    it("should prevent non-director from removing members", async () => {
      const [nonDirector] = await db
        .insert(users)
        .values({
          username: `test-non-director-${Date.now()}`,
          password: "hashed-password",
        })
        .returning();

      await expect(
        removeMember(testTroupeId, testMemberId, nonDirector.id)
      ).rejects.toThrow("Only the director can remove members");

      // Cleanup
      await db.delete(users).where(eq(users.id, nonDirector.id));
    });
  });
});

