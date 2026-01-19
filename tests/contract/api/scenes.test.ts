import { GET, POST } from "@/app/api/scripts/[id]/scenes/route";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock db
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

// Import services - these will be real implementations
import * as sceneService from "@/lib/scenes/service";
import * as scriptService from "@/lib/scripts/service";

// Create spies for services
let createScene: jest.SpyInstance;
let getScenesByScript: jest.SpyInstance;
let getScript: jest.SpyInstance;

describe("Scene API Contract Tests", () => {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(() => {
    // Create spies once before all tests
    createScene = jest.spyOn(sceneService, "createScene");
    getScenesByScript = jest.spyOn(sceneService, "getScenesByScript");
    getScript = jest.spyOn(scriptService, "getScript");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUserId },
    });
    // Reset service spies
    createScene.mockReset();
    getScenesByScript.mockReset();
    getScript.mockReset();
  });

  afterAll(() => {
    // Restore all spies to original implementations to avoid affecting other tests
    createScene.mockRestore();
    getScenesByScript.mockRestore();
    getScript.mockRestore();
  });

  describe("GET /api/scripts/[id]/scenes", () => {
    it("should return 200 with scenes array when user has access", async () => {
      getScenesByScript.mockResolvedValue([mockScene]);

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/scenes`
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe(200);
      expect(data.scenes).toEqual([mockScene]);
      expect(getScenesByScript).toHaveBeenCalledWith(mockScriptId, mockUserId);
    });

    it("should return 401 when user is not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/scenes`
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await GET(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Unauthorized");
      expect(getScenesByScript).not.toHaveBeenCalled();
    });

    it("should return 403 when user does not have access to script", async () => {
      getScenesByScript.mockRejectedValue(
        new Error("You do not have access to this script")
      );

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/scenes`
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await GET(request, { params });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Forbidden");
      expect(data.message).toContain("access");
    });

    it("should return 404 when script does not exist", async () => {
      getScenesByScript.mockRejectedValue(new Error("Script not found"));

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/scenes`
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("NotFound");
    });
  });

  describe("POST /api/scripts/[id]/scenes", () => {
    it("should return 201 with created scene when user has access", async () => {
      createScene.mockResolvedValue(mockScene);

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/scenes`,
        {
          method: "POST",
        }
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await POST(request, { params });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe(201);
      expect(data.scene).toEqual(mockScene);
      expect(createScene).toHaveBeenCalledWith(mockScriptId, mockUserId);
    });

    it("should return 401 when user is not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/scenes`,
        {
          method: "POST",
        }
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await POST(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Unauthorized");
      expect(createScene).not.toHaveBeenCalled();
    });

    it("should return 403 when user does not have access to script", async () => {
      createScene.mockRejectedValue(
        new Error("You do not have access to this script")
      );

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/scenes`,
        {
          method: "POST",
        }
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await POST(request, { params });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Forbidden");
      expect(data.message).toContain("access");
    });

    it("should return 404 when script does not exist", async () => {
      createScene.mockRejectedValue(new Error("Script not found"));

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/scenes`,
        {
          method: "POST",
        }
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await POST(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("NotFound");
    });
  });
});
