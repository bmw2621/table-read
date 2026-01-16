import { db } from "@/lib/db";
import { scripts, troupeMemberships } from "@/lib/db/schema";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

// Import access function - this will be the real implementation
import { canAccessScript } from "@/lib/scripts/access";

describe("Script Access Control", () => {
  const mockUserId = "user-123";
  const mockTroupeId = "troupe-456";
  const mockScriptId = "script-789";
  const mockOtherUserId = "user-999";

  const mockUserOwnedScript = {
    id: mockScriptId,
    title: "My Script",
    userId: mockUserId,
    troupeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTroupeOwnedScript = {
    id: mockScriptId,
    title: "Troupe Script",
    userId: null,
    troupeId: mockTroupeId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("canAccessScript", () => {
    it("should return true when user owns the script", async () => {
      const result = await canAccessScript(mockUserId, mockUserOwnedScript);

      expect(result).toBe(true);
      // Should not query database for user-owned scripts
      expect(db.select).not.toHaveBeenCalled();
    });

    it("should return true when user is a member of the troupe that owns the script", async () => {
      // Mock membership check - user is a member
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: "membership-123" }]),
          }),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await canAccessScript(mockUserId, mockTroupeOwnedScript);

      expect(result).toBe(true);
      expect(db.select).toHaveBeenCalled();
    });

    it("should return false when user is not a member of the troupe that owns the script", async () => {
      // Mock membership check - user is NOT a member
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await canAccessScript(mockOtherUserId, mockTroupeOwnedScript);

      expect(result).toBe(false);
      expect(db.select).toHaveBeenCalled();
    });

    it("should return false when script has no owner (edge case)", async () => {
      const orphanScript = {
        ...mockTroupeOwnedScript,
        userId: null,
        troupeId: null,
      };

      const result = await canAccessScript(mockUserId, orphanScript);

      expect(result).toBe(false);
    });
  });
});

