import { db } from "@/lib/db";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

// Import services - these will be real implementations
import { canAccessScene } from "@/lib/scenes/access";
import * as scriptAccess from "@/lib/scripts/access";
import * as scriptService from "@/lib/scripts/service";

// Create spies for dependencies
let canAccessScript: jest.SpyInstance;
let getScript: jest.SpyInstance;

describe("Scene Access Control", () => {
  const mockUserId = "user-123";
  const mockScriptId = "script-789";
  const mockSceneId = "scene-456";

  const mockScene = {
    id: mockSceneId,
    scriptId: mockScriptId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockScript = {
    id: mockScriptId,
    title: "My Script",
    userId: "user-123",
    troupeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    // Create spies once before all tests
    canAccessScript = jest.spyOn(scriptAccess, "canAccessScript");
    getScript = jest.spyOn(scriptService, "getScript");
  });

  beforeEach(() => {
    jest.resetAllMocks();

    // Reset db.select mock to return proper chainable object
    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockScene]),
        }),
      }),
    }));

    // Reset spies
    getScript.mockReset();
    canAccessScript.mockReset();

    // Default getScript to return mock script
    getScript.mockResolvedValue(mockScript);
    // Default canAccessScript to return true
    canAccessScript.mockResolvedValue(true);
  });

  afterAll(() => {
    // Restore all spies
    canAccessScript.mockRestore();
    getScript.mockRestore();
  });

  describe("canAccessScene", () => {
    it("should return true when scene exists and user has access to script", async () => {
      const result = await canAccessScene(mockSceneId, mockUserId);

      expect(db.select).toHaveBeenCalledWith();
      expect(getScript).toHaveBeenCalledWith(mockScriptId);
      expect(canAccessScript).toHaveBeenCalledWith(mockUserId, mockScript);
      expect(result).toBe(true);
    });

    it("should return false when scene does not exist", async () => {
      (db.select as jest.Mock).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }));

      const result = await canAccessScene(mockSceneId, mockUserId);

      expect(result).toBe(false);
      expect(canAccessScript).not.toHaveBeenCalled();
    });

    it("should return false when user does not have access to script", async () => {
      canAccessScript.mockResolvedValue(false);

      const result = await canAccessScene(mockSceneId, mockUserId);

      expect(result).toBe(false);
    });
  });
});
