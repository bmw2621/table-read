import { createScript } from "@/lib/scripts/service";
import { db } from "@/lib/db";
import { scripts, troupeMemberships } from "@/lib/db/schema";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
  },
}));

describe("Script Service", () => {
  const mockUserId = "user-123";
  const mockTroupeId = "troupe-456";
  const mockScriptId = "script-789";
  const mockTitle = "My Script";

  const mockUserOwnedScript = {
    id: mockScriptId,
    title: mockTitle,
    userId: mockUserId,
    troupeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTroupeOwnedScript = {
    id: mockScriptId,
    title: mockTitle,
    userId: null,
    troupeId: mockTroupeId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset db.insert mock to return proper chainable object
    (db.insert as jest.Mock).mockImplementation(() => ({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    }));

    // Reset db.select mock to return proper chainable object
    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    }));
  });

  describe("createScript", () => {
    it("should create a user-owned script when no troupeId is provided", async () => {
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUserOwnedScript]),
        }),
      });

      const result = await createScript({
        title: mockTitle,
        userId: mockUserId,
      });

      expect(result).toEqual(mockUserOwnedScript);
      expect(db.insert).toHaveBeenCalledWith(scripts);
      expect((db.insert as jest.Mock).mock.results[0].value.values).toHaveBeenCalledWith({
        title: mockTitle,
        userId: mockUserId,
        troupeId: null,
      });
    });

    it("should create a troupe-owned script when troupeId is provided and user is a member", async () => {
      // Mock membership check - user is a member
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: "membership-123" }]),
          }),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockTroupeOwnedScript]),
        }),
      });

      const result = await createScript({
        title: mockTitle,
        userId: mockUserId,
        troupeId: mockTroupeId,
      });

      expect(result).toEqual(mockTroupeOwnedScript);
      expect(db.insert).toHaveBeenCalledWith(scripts);
      expect((db.insert as jest.Mock).mock.results[0].value.values).toHaveBeenCalledWith({
        title: mockTitle,
        userId: null,
        troupeId: mockTroupeId,
      });
    });

    it("should throw error when troupeId is provided but user is not a member", async () => {
      // Mock membership check - user is NOT a member
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        createScript({
          title: mockTitle,
          userId: mockUserId,
          troupeId: mockTroupeId,
        })
      ).rejects.toThrow("You are not a member of this troupe");

      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should throw error when title is empty", async () => {
      await expect(
        createScript({
          title: "",
          userId: mockUserId,
        })
      ).rejects.toThrow("Title is required");

      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should throw error when title is not provided", async () => {
      await expect(
        createScript({
          title: undefined as any,
          userId: mockUserId,
        })
      ).rejects.toThrow("Title is required");

      expect(db.insert).not.toHaveBeenCalled();
    });
  });
});

