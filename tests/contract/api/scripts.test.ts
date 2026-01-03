import { DELETE, GET as GETById, PUT } from "@/app/api/scripts/[id]/route";
import { GET, POST } from "@/app/api/scripts/route";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock services
jest.mock("@/lib/scripts/service", () => ({
  createScript: jest.fn(),
  getUserScripts: jest.fn(),
}));

// Mock access control
jest.mock("@/lib/scripts/access", () => ({
  canAccessScript: jest.fn(),
}));

// Mock permissions
jest.mock("@/lib/troupes/permissions", () => ({
  isDirector: jest.fn(),
}));

// Mock db for GET routes
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { db } from "@/lib/db";
import { canAccessScript } from "@/lib/scripts/access";
import { createScript, getUserScripts } from "@/lib/scripts/service";
import { isDirector } from "@/lib/troupes/permissions";

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
      (getUserScripts as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/scripts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("scripts");
      expect(Array.isArray(data.scripts)).toBe(true);
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
      expect(getUserScripts).toHaveBeenCalledWith(mockUserId);
    });

    it("should include troupe-owned scripts when user is a troupe member", async () => {
      const mockTroupeId = "troupe-123";
      const mockTroupeScript = {
        id: "script-troupe-1",
        title: "Troupe Script",
        userId: null,
        troupeId: mockTroupeId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerType: "troupe",
      };

      (getUserScripts as jest.Mock).mockResolvedValue([mockTroupeScript]);

      const request = new NextRequest("http://localhost/api/scripts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.scripts).toHaveLength(1);
      expect(data.scripts[0].troupeId).toBe(mockTroupeId);
      expect(data.scripts[0].ownerType).toBe("troupe");
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
      const mockScript = {
        id: mockScriptId,
        title: "My Script",
        userId: mockUserId,
        troupeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock db.select for script lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockScript]),
          }),
        }),
      });

      (canAccessScript as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`
      );
      const response = await GETById(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("script");
      expect(data.script.id).toBe(mockScriptId);
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
      expect(canAccessScript).toHaveBeenCalledWith(mockUserId, mockScript);
    });

    it("should return 404 when script not found", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`
      );
      const response = await GETById(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("error", "NotFound");
      expect(data).toHaveProperty("status", 404);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`
      );
      const response = await GETById(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
      expect(data).toHaveProperty("status", 401);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 403 when user does not have access to troupe-owned script", async () => {
      const troupeOwnedScript = {
        id: mockScriptId,
        title: "Troupe Script",
        userId: null,
        troupeId: mockTroupeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock script lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([troupeOwnedScript]),
          }),
        }),
      });

      (canAccessScript as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`
      );
      const response = await GETById(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty("error", "Forbidden");
      expect(data).toHaveProperty(
        "message",
        "You do not have access to this script"
      );
      expect(data).toHaveProperty("status", 403);
      expect(data).toHaveProperty("ok", false);
      expect(canAccessScript).toHaveBeenCalledWith(
        mockUserId,
        troupeOwnedScript
      );
    });

    it("should return 200 when user is a member of troupe that owns the script", async () => {
      const troupeOwnedScript = {
        id: mockScriptId,
        title: "Troupe Script",
        userId: null,
        troupeId: mockTroupeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock script lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([troupeOwnedScript]),
          }),
        }),
      });

      (canAccessScript as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`
      );
      const response = await GETById(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("script");
      expect(data.script.id).toBe(mockScriptId);
      expect(data.script.ownerType).toBe("troupe");
      expect(data.script.canEdit).toBe(true); // Troupe members can edit troupe-owned scripts
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
      expect(canAccessScript).toHaveBeenCalledWith(
        mockUserId,
        troupeOwnedScript
      );
    });
  });

  describe("PUT /api/scripts/[id]", () => {
    it("should return 200 with updated script when owner updates", async () => {
      const mockScript = {
        id: mockScriptId,
        title: "Old Title",
        userId: mockUserId,
        troupeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock script lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockScript]),
          }),
        }),
      });

      (canAccessScript as jest.Mock).mockResolvedValue(true);

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

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            id: mockScriptId,
            title: "New Title",
          }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("script");
      expect(data.script.title).toBe("New Title");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
      expect(canAccessScript).toHaveBeenCalledWith(mockUserId, mockScript);
    });

    it("should return 400 when title is missing", async () => {
      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`,
        {
          method: "PUT",
          body: JSON.stringify({}),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error", "ValidationError");
      expect(data).toHaveProperty("status", 400);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: "New Title",
          }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
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

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
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

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("error", "NotFound");
      expect(data).toHaveProperty("status", 404);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
      expect(data).toHaveProperty("status", 401);
      expect(data).toHaveProperty("ok", false);
    });

    it("should return 200 when director deletes troupe-owned script", async () => {
      const troupeOwnedScript = {
        id: mockScriptId,
        title: "Troupe Script",
        userId: null,
        troupeId: mockTroupeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock script lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([troupeOwnedScript]),
          }),
        }),
      });

      // Mock director check
      (isDirector as jest.Mock).mockResolvedValue(true);

      // Mock db.delete
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (db as any).delete = mockDelete;

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
      expect(isDirector).toHaveBeenCalledWith(mockUserId, mockTroupeId);
    });

    it("should return 403 when non-director tries to delete troupe-owned script", async () => {
      const troupeOwnedScript = {
        id: mockScriptId,
        title: "Troupe Script",
        userId: null,
        troupeId: mockTroupeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock script lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([troupeOwnedScript]),
          }),
        }),
      });

      // Mock director check - user is NOT director
      (isDirector as jest.Mock).mockResolvedValue(false);

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty("error", "Forbidden");
      expect(data).toHaveProperty(
        "message",
        "Only the troupe director can delete this script"
      );
      expect(data).toHaveProperty("status", 403);
      expect(data).toHaveProperty("ok", false);
      expect(isDirector).toHaveBeenCalledWith(mockUserId, mockTroupeId);
    });

    it("should return 403 when non-owner tries to delete user-owned script", async () => {
      const userOwnedScript = {
        id: mockScriptId,
        title: "User Script",
        userId: "other-user-id",
        troupeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock script lookup
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([userOwnedScript]),
          }),
        }),
      });

      const request = new NextRequest(
        `http://localhost/api/scripts/${mockScriptId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockScriptId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty("error", "Forbidden");
      expect(data).toHaveProperty(
        "message",
        "Only the owner can delete this script"
      );
      expect(data).toHaveProperty("status", 403);
      expect(data).toHaveProperty("ok", false);
    });
  });
});
