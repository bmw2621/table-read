import { db } from "@/lib/db";
import { scenes } from "@/lib/db/schema";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
  },
}));

// Import services - these will be real implementations
import { createScene, getScenesByScript } from "@/lib/scenes/service";
import * as scriptAccess from "@/lib/scripts/access";
import * as scriptService from "@/lib/scripts/service";

// Create spies for dependencies
let canAccessScript: jest.SpyInstance;
let getScript: jest.SpyInstance;

describe("Scene Service", () => {
  const mockUserId = "user-123";
  const mockScriptId = "script-789";
  const mockSceneId = "scene-456";

  const mockScript = {
    id: mockScriptId,
    title: "My Script",
    userId: mockUserId,
    troupeId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockScene = {
    id: mockSceneId,
    scriptId: mockScriptId,
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

    // Reset db.insert mock to return proper chainable object
    (db.insert as jest.Mock).mockImplementation(() => ({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockScene]),
      }),
    }));

    // Reset db.select mock to return proper chainable object
    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockScene]),
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

  describe("createScene", () => {
    it("should create a scene when user has access to script", async () => {
      const scene = await createScene(mockScriptId, mockUserId);

      expect(getScript).toHaveBeenCalledWith(mockScriptId);
      expect(canAccessScript).toHaveBeenCalledWith(mockUserId, mockScript);
      expect(db.insert).toHaveBeenCalledWith(scenes);
      expect(scene).toEqual(mockScene);
    });

    it("should throw error when script does not exist", async () => {
      getScript.mockResolvedValue(null);

      await expect(createScene(mockScriptId, mockUserId)).rejects.toThrow(
        "Script not found"
      );

      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should throw error when user does not have access to script", async () => {
      canAccessScript.mockResolvedValue(false);

      await expect(createScene(mockScriptId, mockUserId)).rejects.toThrow(
        "You do not have access to this script"
      );

      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe("getScenesByScript", () => {
    it("should return scenes for a script when user has access", async () => {
      const result = await getScenesByScript(mockScriptId, mockUserId);

      expect(getScript).toHaveBeenCalledWith(mockScriptId);
      expect(canAccessScript).toHaveBeenCalledWith(mockUserId, mockScript);
      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual([mockScene]);
    });

    it("should throw error when script does not exist", async () => {
      getScript.mockResolvedValue(null);

      await expect(getScenesByScript(mockScriptId, mockUserId)).rejects.toThrow(
        "Script not found"
      );

      expect(db.select).not.toHaveBeenCalled();
    });

    it("should throw error when user does not have access to script", async () => {
      canAccessScript.mockResolvedValue(false);

      await expect(getScenesByScript(mockScriptId, mockUserId)).rejects.toThrow(
        "You do not have access to this script"
      );

      expect(db.select).not.toHaveBeenCalled();
    });
  });
});
