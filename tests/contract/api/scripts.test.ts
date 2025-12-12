import { GET, POST } from "@/app/api/scripts/route";
import { GET as GETById, PUT, DELETE } from "@/app/api/scripts/[id]/route";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock services
jest.mock("@/lib/scripts/service", () => ({
  createScript: jest.fn(),
}));

// Mock db for GET routes
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

import { createScript } from "@/lib/scripts/service";
import { db } from "@/lib/db";

describe("Script API Contract Tests", () => {
  const mockUserId = "user-123";
  const mockTroupeId = "troupe-456";
  const mockScriptId = "script-789";

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUserId },
    });
  });

  describe("GET /api/scripts", () => {
    it("should return 200 with scripts list when authenticated", async () => {
      // Mock db.select chain - first call for troupe memberships, second for scripts
      let callCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: troupe memberships query
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]), // Empty array - no troupes
            }),
          };
        } else {
          // Second call: scripts query
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]), // Empty array - no scripts
            }),
          };
        }
      });

      const request = new NextRequest("http://localhost/api/scripts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("scripts");
      expect(Array.isArray(data.scripts)).toBe(true);
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/scripts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
      expect(data).toHaveProperty("status", 401);
      expect(data).toHaveProperty("ok", false);
    });
  });

  describe("POST /api/scripts", () => {
    it("should return 201 with script when creating user-owned script", async () => {
      const mockScript = {
        id: mockScriptId,
        title: "My Script",
        userId: mockUserId,
        troupeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (createScript as jest.Mock).mockResolvedValue(mockScript);

      const request = new NextRequest("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({
          title: "My Script",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("script");
      expect(data.script.id).toBe(mockScriptId);
      expect(data.script.title).toBe("My Script");
      expect(data).toHaveProperty("status", 201);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 201 with script when creating troupe-owned script", async () => {
      const mockScript = {
        id: mockScriptId,
        title: "Troupe Script",
        userId: null,
        troupeId: mockTroupeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (createScript as jest.Mock).mockResolvedValue(mockScript);

      const request = new NextRequest("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({
          title: "Troupe Script",
          troupeId: mockTroupeId,
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("script");
      expect(data.script.troupeId).toBe(mockTroupeId);
      expect(data.script.userId).toBeNull();
      expect(data).toHaveProperty("status", 201);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 400 when title is missing", async () => {
      const request = new NextRequest("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error", "ValidationError");
      expect(data).toHaveProperty("status", 400);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({
          title: "My Script",
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
      expect(data).toHaveProperty("status", 401);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 403 when user is not a member of troupe", async () => {
      (createScript as jest.Mock).mockRejectedValue(
        new Error("You are not a member of this troupe")
      );

      const request = new NextRequest("http://localhost/api/scripts", {
        method: "POST",
        body: JSON.stringify({
          title: "Troupe Script",
          troupeId: mockTroupeId,
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty("error", "Forbidden");
      expect(data).toHaveProperty("status", 403);
      expect(data).toHaveProperty("ok", false);
    });
  });

  describe("GET /api/scripts/[id]", () => {
    it("should return 200 with script when user has access", async () => {
      // Mock db.select chain for script lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: mockScriptId,
                title: "My Script",
                userId: mockUserId,
                troupeId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const request = new NextRequest(`http://localhost/api/scripts/${mockScriptId}`);
      const response = await GETById(request, { params: Promise.resolve({ id: mockScriptId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("script");
      expect(data.script.id).toBe(mockScriptId);
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 404 when script not found", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const request = new NextRequest(`http://localhost/api/scripts/${mockScriptId}`);
      const response = await GETById(request, { params: Promise.resolve({ id: mockScriptId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("error", "NotFound");
      expect(data).toHaveProperty("status", 404);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/scripts/${mockScriptId}`);
      const response = await GETById(request, { params: Promise.resolve({ id: mockScriptId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
      expect(data).toHaveProperty("status", 401);
      expect(data).toHaveProperty("ok", false);
    });
  });

  describe("PUT /api/scripts/[id]", () => {
    it("should return 200 with updated script when owner updates", async () => {
      // Mock script lookup and update
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: mockScriptId,
                title: "Old Title",
                userId: mockUserId,
                troupeId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      });

      // Mock db.update
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: mockScriptId,
                title: "New Title",
                userId: mockUserId,
                troupeId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      });
      (db as any).update = mockUpdate;

      const request = new NextRequest(`http://localhost/api/scripts/${mockScriptId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: "New Title",
        }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: mockScriptId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("script");
      expect(data.script.title).toBe("New Title");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 400 when title is missing", async () => {
      const request = new NextRequest(`http://localhost/api/scripts/${mockScriptId}`, {
        method: "PUT",
        body: JSON.stringify({}),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: mockScriptId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error", "ValidationError");
      expect(data).toHaveProperty("status", 400);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/scripts/${mockScriptId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: "New Title",
        }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: mockScriptId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
      expect(data).toHaveProperty("status", 401);
      expect(data).toHaveProperty("ok", false);
    });
  });

  describe("DELETE /api/scripts/[id]", () => {
    it("should return 200 when owner deletes script", async () => {
      // Mock script lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: mockScriptId,
                title: "My Script",
                userId: mockUserId,
                troupeId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      });

      // Mock db.delete
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (db as any).delete = mockDelete;

      const request = new NextRequest(`http://localhost/api/scripts/${mockScriptId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: mockScriptId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 404 when script not found", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const request = new NextRequest(`http://localhost/api/scripts/${mockScriptId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: mockScriptId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("error", "NotFound");
      expect(data).toHaveProperty("status", 404);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/scripts/${mockScriptId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: mockScriptId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
      expect(data).toHaveProperty("status", 401);
      expect(data).toHaveProperty("ok", false);
    });
  });
});

