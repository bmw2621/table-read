import { canManageTroupe } from "@/lib/troupes/permissions";
import { db } from "@/lib/db";
import { troupes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

describe("Troupe Permissions", () => {
  const mockUserId = "user-123";
  const mockTroupeId = "troupe-456";
  const mockDirectorId = "director-789";

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("canManageTroupe", () => {
    it("should return true when user is director", async () => {
      const mockTroupe = {
        id: mockTroupeId,
        directorId: mockUserId,
        name: "Test Troupe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockTroupe]),
          }),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await canManageTroupe(mockUserId, mockTroupeId);
      expect(result).toBe(true);
    });

    it("should return false when user is not director", async () => {
      const mockTroupe = {
        id: mockTroupeId,
        directorId: mockDirectorId,
        name: "Test Troupe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockTroupe]),
          }),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await canManageTroupe(mockUserId, mockTroupeId);
      expect(result).toBe(false);
    });

    it("should return false when troupe does not exist", async () => {
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await canManageTroupe(mockUserId, mockTroupeId);
      expect(result).toBe(false);
    });
  });
});

