import { db } from "@/lib/db";
import { lines } from "@/lib/db/schema";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
  },
}));

// Import services - these will be real implementations
import { createLine, getLinesByScene } from "@/lib/lines/service";
import * as scriptAccess from "@/lib/scripts/access";
import * as scriptService from "@/lib/scripts/service";

// Create spies for dependencies
let canAccessScript: jest.SpyInstance;
let getScript: jest.SpyInstance;

describe("Line Service", () => {
  const mockUserId = "user-123";
  const mockScriptId = "script-789";
  const mockSceneId = "scene-456";
  const mockCharacterId = "character-123";
  const mockLineId = "line-789";

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

  const mockCharacter = {
    id: mockCharacterId,
    scriptId: mockScriptId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLine = {
    id: mockLineId,
    text: "Hello, world!",
    characterId: mockCharacterId,
    sceneId: mockSceneId,
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
        returning: jest.fn().mockResolvedValue([mockLine]),
      }),
    }));

    // Reset db.select mock - track call order to return different results
    let selectCallCount = 0;
    (db.select as jest.Mock).mockImplementation(() => {
      selectCallCount++;
      // First call: get scene, second call: get character (if provided), third call: get lines
      if (selectCallCount === 1) {
        // First call: get scene
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockScene]),
            }),
          }),
        };
      } else if (selectCallCount === 2) {
        // Second call: get character (if characterId provided)
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockCharacter]),
            }),
          }),
        };
      } else {
        // Third call: get lines
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockLine]),
          }),
        };
      }
    });

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

  describe("createLine", () => {
    it("should create a line with character when user has access and character/scene belong to same script", async () => {
      const line = await createLine(
        "Hello, world!",
        mockSceneId,
        mockUserId,
        mockCharacterId
      );

      expect(db.select).toHaveBeenCalled();
      expect(canAccessScript).toHaveBeenCalledWith(mockUserId, mockScript);
      expect(db.insert).toHaveBeenCalledWith(lines);
      expect(line).toEqual(mockLine);
    });

    it("should create a line without character when characterId is not provided", async () => {
      const lineWithoutCharacter = {
        ...mockLine,
        characterId: null,
      };

      (db.insert as jest.Mock).mockImplementation(() => ({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([lineWithoutCharacter]),
        }),
      }));

      const line = await createLine("Hello, world!", mockSceneId, mockUserId);

      expect(db.insert).toHaveBeenCalledWith(lines);
      expect(line.characterId).toBeNull();
    });

    it("should throw error when scene does not exist", async () => {
      (db.select as jest.Mock).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }));

      await expect(
        createLine("Hello, world!", mockSceneId, mockUserId, mockCharacterId)
      ).rejects.toThrow("Scene not found");

      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should throw error when character does not exist but characterId is provided", async () => {
      let callCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get scene
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockScene]),
              }),
            }),
          };
        } else {
          // Second call: get character (not found)
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          };
        }
      });

      await expect(
        createLine("Hello, world!", mockSceneId, mockUserId, mockCharacterId)
      ).rejects.toThrow("Character not found");

      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should throw error when character and scene belong to different scripts", async () => {
      const differentScriptCharacter = {
        ...mockCharacter,
        scriptId: "different-script-id",
      };

      let callCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get scene
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockScene]),
              }),
            }),
          };
        } else {
          // Second call: get character (different script)
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([differentScriptCharacter]),
              }),
            }),
          };
        }
      });

      await expect(
        createLine("Hello, world!", mockSceneId, mockUserId, mockCharacterId)
      ).rejects.toThrow("Character and scene must belong to the same script");

      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should throw error when user does not have access to script", async () => {
      canAccessScript.mockResolvedValue(false);

      await expect(
        createLine("Hello, world!", mockSceneId, mockUserId, mockCharacterId)
      ).rejects.toThrow("You do not have access to this scene's script");

      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe("getLinesByScene", () => {
    it("should return lines for a scene when user has access", async () => {
      let callCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get scene
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockScene]),
              }),
            }),
          };
        } else {
          // Second call: get lines
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([mockLine]),
            }),
          };
        }
      });

      const result = await getLinesByScene(mockSceneId, mockUserId);

      expect(db.select).toHaveBeenCalled();
      expect(canAccessScript).toHaveBeenCalledWith(mockUserId, mockScript);
      expect(result).toEqual([mockLine]);
    });

    it("should throw error when scene does not exist", async () => {
      (db.select as jest.Mock).mockImplementation(() => ({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }));

      await expect(getLinesByScene(mockSceneId, mockUserId)).rejects.toThrow(
        "Scene not found"
      );
    });

    it("should throw error when user does not have access to script", async () => {
      canAccessScript.mockResolvedValue(false);

      await expect(getLinesByScene(mockSceneId, mockUserId)).rejects.toThrow(
        "You do not have access to this scene's script"
      );
    });
  });
});
