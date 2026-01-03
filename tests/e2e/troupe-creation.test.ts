import { createTroupe } from "@/lib/troupes/service";
import { db } from "@/lib/db";
import { troupes, troupeMemberships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("E2E: Troupe Creation and Director Assignment Flow", () => {
  let testDirectorId: string;
  let testTroupeId: string;

  beforeAll(async () => {
    // Create a test user who will become a director
    const [testUser] = await db
      .insert(users)
      .values({
        username: `e2e-director-${Date.now()}`,
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

  it("should create troupe and automatically assign user as director and first member", async () => {
    // Step 1: User creates a troupe
    const troupe = await createTroupe(testDirectorId, "Test Troupe");
    testTroupeId = troupe.id;

    // Step 2: Verify troupe was created with correct director
    expect(troupe).toBeDefined();
    expect(troupe.directorId).toBe(testDirectorId);
    expect(troupe.id).toBeTruthy();

    // Step 3: Verify troupe exists in database
    const [dbTroupe] = await db
      .select()
      .from(troupes)
      .where(eq(troupes.id, troupe.id))
      .limit(1);

    expect(dbTroupe).toBeDefined();
    expect(dbTroupe?.directorId).toBe(testDirectorId);

    // Step 4: Verify director was automatically added as first member
    const members = await db
      .select()
      .from(troupeMemberships)
      .where(eq(troupeMemberships.troupeId, troupe.id));

    expect(members.length).toBe(1);
    expect(members[0].userId).toBe(testDirectorId);
    expect(members[0].troupeId).toBe(troupe.id);

    // Step 5: Verify director can be found in troupe memberships
    const directorMembership = members.find((m) => m.userId === testDirectorId);
    expect(directorMembership).toBeDefined();
    expect(directorMembership?.troupeId).toBe(troupe.id);
  });
});

