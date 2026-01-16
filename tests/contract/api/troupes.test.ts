import { DELETE as DELETEMember } from "@/app/api/troupes/[id]/members/[userId]/route";
import { POST as POSTMember } from "@/app/api/troupes/[id]/members/route";
import { DELETE, GET as GETById } from "@/app/api/troupes/[id]/route";
import { GET, POST } from "@/app/api/troupes/route";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock database first
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}));

// Import services - these will be real implementations
import { db } from "@/lib/db";
import * as troupeService from "@/lib/troupes/service";

// Create spies for services - these will wrap the real implementations
// and can be mocked per test without affecting unit tests
let createTroupe: jest.SpyInstance;
let getUserTroupes: jest.SpyInstance;
let deleteTroupe: jest.SpyInstance;
let approveMember: jest.SpyInstance;
let removeMember: jest.SpyInstance;

describe("Troupe API Contract Tests", () => {
  const mockUserId = "user-123";
  const mockTroupeId = "troupe-456";
  const mockMemberId = "member-789";

  beforeAll(() => {
    // Create spies once before all tests
    createTroupe = jest.spyOn(troupeService, "createTroupe");
    getUserTroupes = jest.spyOn(troupeService, "getUserTroupes");
    deleteTroupe = jest.spyOn(troupeService, "deleteTroupe");
    approveMember = jest.spyOn(troupeService, "approveMember");
    removeMember = jest.spyOn(troupeService, "removeMember");
  });

  beforeEach(() => {
    jest.resetAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUserId },
    });
    // Reset service spies
    createTroupe.mockReset();
    getUserTroupes.mockReset();
    deleteTroupe.mockReset();
    approveMember.mockReset();
    removeMember.mockReset();
  });

  afterAll(() => {
    // Restore all spies to original implementations to avoid affecting other tests
    createTroupe.mockRestore();
    getUserTroupes.mockRestore();
    deleteTroupe.mockRestore();
    approveMember.mockRestore();
    removeMember.mockRestore();
  });

  describe("GET /api/troupes", () => {
    it("should return 200 with troupes list when authenticated", async () => {
      const mockTroupes = [
        {
          id: mockTroupeId,
          directorId: mockUserId,
          name: "Test Troupe",
          isDirector: true,
          memberCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      getUserTroupes.mockResolvedValue(mockTroupes);

      const request = new NextRequest("http://localhost/api/troupes");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("troupes");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/troupes");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
      expect(data).toHaveProperty("status", 401);
      expect(data).toHaveProperty("ok", false);
    });
  });

  describe("POST /api/troupes", () => {
    it("should return 201 with troupe when authenticated", async () => {
      const mockTroupe = {
        id: mockTroupeId,
        directorId: mockUserId,
        name: "Test Troupe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createTroupe.mockResolvedValue(mockTroupe);

      const request = new NextRequest("http://localhost/api/troupes", {
        method: "POST",
        body: JSON.stringify({ name: "Test Troupe" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("troupe");
      expect(data.troupe.id).toBe(mockTroupeId);
      expect(data).toHaveProperty("status", 201);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/troupes", {
        method: "POST",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("GET /api/troupes/[id]", () => {
    it("should return 200 with troupe details when authenticated and member", async () => {
      const mockTroupe = {
        id: mockTroupeId,
        directorId: mockUserId,
        name: "Test Troupe",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockMembership = {
        id: "membership-123",
        userId: mockUserId,
        troupeId: mockTroupeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database queries
      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockTroupe]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockMembership]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([mockMembership]),
          }),
        });

      const request = new NextRequest(
        `http://localhost/api/troupes/${mockTroupeId}`
      );
      const response = await GETById(request, {
        params: Promise.resolve({ id: mockTroupeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("troupe");
      expect(data.troupe).toHaveProperty("id");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost/api/troupes/${mockTroupeId}`
      );
      const response = await GETById(request, {
        params: Promise.resolve({ id: mockTroupeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("DELETE /api/troupes/[id]", () => {
    it("should return 200 when director deletes troupe", async () => {
      deleteTroupe.mockResolvedValue(undefined);

      const request = new NextRequest(
        `http://localhost/api/troupes/${mockTroupeId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockTroupeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 403 when non-director tries to delete", async () => {
      deleteTroupe.mockRejectedValue(
        new Error("Only the director can delete a troupe")
      );

      const request = new NextRequest(
        `http://localhost/api/troupes/${mockTroupeId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockTroupeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty("error", "Forbidden");
    });
  });

  describe("POST /api/troupes/[id]/members", () => {
    it("should return 201 when director approves member", async () => {
      const mockMembership = {
        id: "membership-123",
        userId: mockMemberId,
        troupeId: mockTroupeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      approveMember.mockResolvedValue(mockMembership);

      const request = new NextRequest(
        `http://localhost/api/troupes/${mockTroupeId}/members`,
        {
          method: "POST",
          body: JSON.stringify({ userId: mockMemberId }),
        }
      );
      const response = await POSTMember(request, {
        params: Promise.resolve({ id: mockTroupeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("membership");
      expect(data).toHaveProperty("status", 201);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 403 when non-director tries to approve", async () => {
      approveMember.mockRejectedValue(
        new Error("Only the director can approve members")
      );

      const request = new NextRequest(
        `http://localhost/api/troupes/${mockTroupeId}/members`,
        {
          method: "POST",
          body: JSON.stringify({ userId: mockMemberId }),
        }
      );
      const response = await POSTMember(request, {
        params: Promise.resolve({ id: mockTroupeId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty("error", "Forbidden");
    });
  });

  describe("DELETE /api/troupes/[id]/members/[userId]", () => {
    it("should return 200 when director removes member", async () => {
      removeMember.mockResolvedValue(undefined);

      const request = new NextRequest(
        `http://localhost/api/troupes/${mockTroupeId}/members/${mockMemberId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETEMember(request, {
        params: Promise.resolve({ id: mockTroupeId, userId: mockMemberId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 403 when non-director tries to remove", async () => {
      removeMember.mockRejectedValue(
        new Error("Only the director can remove members")
      );

      const request = new NextRequest(
        `http://localhost/api/troupes/${mockTroupeId}/members/${mockMemberId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETEMember(request, {
        params: Promise.resolve({ id: mockTroupeId, userId: mockMemberId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty("error", "Forbidden");
    });
  });
});
