import { GET, POST } from "@/app/api/scenes/[id]/lines/route";
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
import * as lineService from "@/lib/lines/service";

// Create spies for services
let createLine: jest.SpyInstance;
let getLinesByScene: jest.SpyInstance;

describe("Line API Contract Tests", () => {
  const mockUserId = "user-123";
  const mockSceneId = "scene-456";
  const mockCharacterId = "character-123";
  const mockLineId = "line-789";

  const mockLine = {
    id: mockLineId,
    text: "Hello, world!",
    characterId: mockCharacterId,
    sceneId: mockSceneId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockLineWithoutCharacter = {
    id: mockLineId,
    text: "Narrator line",
    characterId: null,
    sceneId: mockSceneId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(() => {
    // Create spies once before all tests
    createLine = jest.spyOn(lineService, "createLine");
    getLinesByScene = jest.spyOn(lineService, "getLinesByScene");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUserId },
    });
    // Reset service spies
    createLine.mockReset();
    getLinesByScene.mockReset();
  });

  afterAll(() => {
    // Restore all spies to original implementations to avoid affecting other tests
    createLine.mockRestore();
    getLinesByScene.mockRestore();
  });

  describe("GET /api/scenes/[id]/lines", () => {
    it("should return 200 with lines array when user has access", async () => {
      getLinesByScene.mockResolvedValue([mockLine]);

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe(200);
      expect(data.lines).toEqual([mockLine]);
      expect(getLinesByScene).toHaveBeenCalledWith(mockSceneId, mockUserId);
    });

    it("should return 401 when user is not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await GET(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Unauthorized");
      expect(getLinesByScene).not.toHaveBeenCalled();
    });

    it("should return 403 when user does not have access to scene's script", async () => {
      getLinesByScene.mockRejectedValue(
        new Error("You do not have access to this scene's script")
      );

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await GET(request, { params });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Forbidden");
      expect(data.message).toContain("access");
    });

    it("should return 404 when scene does not exist", async () => {
      getLinesByScene.mockRejectedValue(new Error("Scene not found"));

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("NotFound");
    });
  });

  describe("POST /api/scenes/[id]/lines", () => {
    it("should return 201 with created line when user has access and characterId provided", async () => {
      createLine.mockResolvedValue(mockLine);

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`,
        {
          method: "POST",
          body: JSON.stringify({
            text: "Hello, world!",
            characterId: mockCharacterId,
          }),
        }
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await POST(request, { params });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe(201);
      expect(data.line).toEqual(mockLine);
      expect(createLine).toHaveBeenCalledWith(
        "Hello, world!",
        mockSceneId,
        mockUserId,
        mockCharacterId
      );
    });

    it("should return 201 with created line when user has access and characterId not provided", async () => {
      createLine.mockResolvedValue(mockLineWithoutCharacter);

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`,
        {
          method: "POST",
          body: JSON.stringify({
            text: "Narrator line",
          }),
        }
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await POST(request, { params });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe(201);
      expect(data.line).toEqual(mockLineWithoutCharacter);
      expect(createLine).toHaveBeenCalledWith(
        "Narrator line",
        mockSceneId,
        mockUserId,
        undefined
      );
    });

    it("should return 400 when text is missing", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`,
        {
          method: "POST",
          body: JSON.stringify({
            characterId: mockCharacterId,
          }),
        }
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await POST(request, { params });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("ValidationError");
      expect(createLine).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`,
        {
          method: "POST",
          body: JSON.stringify({
            text: "Hello, world!",
          }),
        }
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await POST(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Unauthorized");
      expect(createLine).not.toHaveBeenCalled();
    });

    it("should return 403 when user does not have access to scene's script", async () => {
      createLine.mockRejectedValue(
        new Error("You do not have access to this scene's script")
      );

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`,
        {
          method: "POST",
          body: JSON.stringify({
            text: "Hello, world!",
          }),
        }
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await POST(request, { params });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Forbidden");
      expect(data.message).toContain("access");
    });

    it("should return 404 when scene does not exist", async () => {
      createLine.mockRejectedValue(new Error("Scene not found"));

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`,
        {
          method: "POST",
          body: JSON.stringify({
            text: "Hello, world!",
          }),
        }
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await POST(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("NotFound");
    });

    it("should return 409 when character and scene belong to different scripts", async () => {
      createLine.mockRejectedValue(
        new Error("Character and scene must belong to the same script")
      );

      const request = new NextRequest(
        `http://localhost:3000/api/scenes/${mockSceneId}/lines`,
        {
          method: "POST",
          body: JSON.stringify({
            text: "Hello, world!",
            characterId: mockCharacterId,
          }),
        }
      );
      const params = Promise.resolve({ id: mockSceneId });
      const response = await POST(request, { params });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Conflict");
      expect(data.message).toContain("same script");
    });
  });
});
