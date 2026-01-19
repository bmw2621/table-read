import { GET, POST } from "@/app/api/scripts/[id]/characters/route";
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
import * as characterService from "@/lib/characters/service";

// Create spies for services
let createCharacter: jest.SpyInstance;
let getCharactersByScript: jest.SpyInstance;

describe("Character API Contract Tests", () => {
  const mockUserId = "user-123";
  const mockScriptId = "script-789";
  const mockCharacterId = "character-456";

  const mockCharacter = {
    id: mockCharacterId,
    scriptId: mockScriptId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(() => {
    // Create spies once before all tests
    createCharacter = jest.spyOn(characterService, "createCharacter");
    getCharactersByScript = jest.spyOn(
      characterService,
      "getCharactersByScript"
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUserId },
    });
    // Reset service spies
    createCharacter.mockReset();
    getCharactersByScript.mockReset();
  });

  afterAll(() => {
    // Restore all spies to original implementations to avoid affecting other tests
    createCharacter.mockRestore();
    getCharactersByScript.mockRestore();
  });

  describe("GET /api/scripts/[id]/characters", () => {
    it("should return 200 with characters array when user has access", async () => {
      getCharactersByScript.mockResolvedValue([mockCharacter]);

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/characters`
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe(200);
      expect(data.characters).toEqual([mockCharacter]);
      expect(getCharactersByScript).toHaveBeenCalledWith(
        mockScriptId,
        mockUserId
      );
    });

    it("should return 401 when user is not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/characters`
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await GET(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Unauthorized");
      expect(getCharactersByScript).not.toHaveBeenCalled();
    });

    it("should return 403 when user does not have access to script", async () => {
      getCharactersByScript.mockRejectedValue(
        new Error("You do not have access to this script")
      );

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/characters`
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
      getCharactersByScript.mockRejectedValue(new Error("Script not found"));

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/characters`
      );
      const params = Promise.resolve({ id: mockScriptId });
      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("NotFound");
    });
  });

  describe("POST /api/scripts/[id]/characters", () => {
    it("should return 201 with created character when user has access", async () => {
      createCharacter.mockResolvedValue(mockCharacter);

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/characters`,
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
      expect(data.character).toEqual(mockCharacter);
      expect(createCharacter).toHaveBeenCalledWith(mockScriptId, mockUserId);
    });

    it("should return 401 when user is not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/characters`,
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
      expect(createCharacter).not.toHaveBeenCalled();
    });

    it("should return 403 when user does not have access to script", async () => {
      createCharacter.mockRejectedValue(
        new Error("You do not have access to this script")
      );

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/characters`,
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
      createCharacter.mockRejectedValue(new Error("Script not found"));

      const request = new NextRequest(
        `http://localhost:3000/api/scripts/${mockScriptId}/characters`,
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
