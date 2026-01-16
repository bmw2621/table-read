import { createTroupe, deleteTroupe } from "@/lib/troupes/service";
import { db } from "@/lib/db";
import { troupes, troupeMemberships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Troupe CRUD Operations", () => {
  let testDirectorId: string;
  let testTroupeId: string;

  beforeAll(async () => {
    // Create a test user for director
    const [testUser] = await db
      .insert(users)
      .values({
        username: `test-director-${Date.now()}`,
        password: "hashed-password",
      })
      .returning();
    testDirectorId = testUser.id;
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
  });

  describe("createTroupe", () => {
    it("should create troupe with director as first member", async () => {
      const troupe = await createTroupe(testDirectorId, "Test Troupe");
      testTroupeId = troupe.id;

      expect(troupe.directorId).toBe(testDirectorId);

      // Verify director is added as member
      const members = await db
        .select()
        .from(troupeMemberships)
        .where(eq(troupeMemberships.troupeId, troupe.id));

      expect(members.length).toBe(1);
      expect(members[0].userId).toBe(testDirectorId);
    });
  });

  describe("listTroupes", () => {
    it("should list troupes user belongs to", async () => {
      const userTroupes = await db
        .select()
        .from(troupes)
        .innerJoin(troupeMemberships, eq(troupeMemberships.troupeId, troupes.id))
        .where(eq(troupeMemberships.userId, testDirectorId));

      expect(userTroupes.length).toBeGreaterThan(0);
      const foundTroupe = userTroupes.find((ut) => ut.troupe.id === testTroupeId);
      expect(foundTroupe).toBeDefined();
    });
  });

  describe("getTroupe", () => {
    it("should get troupe details with members", async () => {
      const [troupe] = await db
        .select()
        .from(troupes)
        .where(eq(troupes.id, testTroupeId))
        .limit(1);

      expect(troupe).toBeDefined();
      expect(troupe.directorId).toBe(testDirectorId);

      const members = await db
        .select()
        .from(troupeMemberships)
        .where(eq(troupeMemberships.troupeId, testTroupeId));

      expect(members.length).toBe(1);
    });
  });

  describe("deleteTroupe", () => {
    it("should delete troupe and cascade to memberships", async () => {
      // Create another troupe to delete
      const troupeToDelete = await createTroupe(testDirectorId, "Troupe To Delete");
      const troupeToDeleteId = troupeToDelete.id;

      await deleteTroupe(troupeToDeleteId, testDirectorId);

      // Verify troupe is deleted
      const deletedTroupe = await db
        .select()
        .from(troupes)
        .where(eq(troupes.id, troupeToDeleteId))
        .limit(1);

      expect(deletedTroupe.length).toBe(0);

      // Verify memberships are cascade deleted
      const memberships = await db
        .select()
        .from(troupeMemberships)
        .where(eq(troupeMemberships.troupeId, troupeToDeleteId));

      expect(memberships.length).toBe(0);
    });
  });
});

