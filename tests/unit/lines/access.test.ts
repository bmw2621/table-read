import { db } from "@/lib/db";
import { lines, scenes } from "@/lib/db/schema";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

// Mock canAccessScene
jest.mock("@/lib/scenes/access", () => ({
  canAccessScene: jest.fn(),
}));

// Import access function - this will be the real implementation
import { canAccessLine } from "@/lib/lines/access";
import { canAccessScene } from "@/lib/scenes/access";

describe("Line Access Control", () => {
  const mockUserId = "user-123";
  const mockSceneId = "scene-456";
  const mockLineId = "line-789";

  const mockLine = {
    id: mockLineId,
    text: "Hello, world!",
    characterId: "character-123",
    sceneId: mockSceneId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Reset db.select mock to return proper chainable object
    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockLine]),
        }),
      }),
    }));

    // Default canAccessScene to return true
    (canAccessScene as jest.Mock).mockResolvedValue(true);
  });

  describe("canAccessLine", () => {
    it("should return true when line exists and user has access to scene", async () => {
      const result = await canAccessLine(mockLineId, mockUserId);

      expect(db.select).toHaveBeenCalledWith();
      expect(canAccessScene).toHaveBeenCalledWith(mockSceneId, mockUserId);
      expect(result).toBe(true);
    });

    it("should return false when line does not exist", async () => {
      (db.select as jest.Mock).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }));

      const result = await canAccessLine(mockLineId, mockUserId);

      expect(result).toBe(false);
      expect(canAccessScene).not.toHaveBeenCalled();
    });

    it("should return false when user does not have access to scene", async () => {
      (canAccessScene as jest.Mock).mockResolvedValue(false);

      const result = await canAccessLine(mockLineId, mockUserId);

      expect(result).toBe(false);
    });
  });
});

