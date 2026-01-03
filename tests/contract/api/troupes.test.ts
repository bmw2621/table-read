import { GET, POST } from "@/app/api/troupes/route";
import { GET as GETById, DELETE } from "@/app/api/troupes/[id]/route";
import { POST as POSTMember } from "@/app/api/troupes/[id]/members/route";
import { DELETE as DELETEMember } from "@/app/api/troupes/[id]/members/[userId]/route";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock services
jest.mock("@/lib/troupes/service", () => ({
  createTroupe: jest.fn(),
  getUserTroupes: jest.fn(),
  deleteTroupe: jest.fn(),
  approveMember: jest.fn(),
  removeMember: jest.fn(),
}));

// Mock db for GET routes
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

import { createTroupe, getUserTroupes, deleteTroupe, approveMember, removeMember } from "@/lib/troupes/service";
import { db } from "@/lib/db";

describe("Troupe API Contract Tests", () => {
  const mockUserId = "user-123";
  const mockTroupeId = "troupe-456";
  const mockMemberId = "member-789";

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: mockUserId },
    });
  });

  describe("GET /api/troupes", () => {
    it("should return 200 with troupes list when authenticated", async () => {
      (getUserTroupes as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/troupes");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("troupes");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
      expect(getUserTroupes).toHaveBeenCalledWith(mockUserId);
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

      (createTroupe as jest.Mock).mockResolvedValue(mockTroupe);

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
      expect(createTroupe).toHaveBeenCalledWith(mockUserId, "Test Troupe");
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

      const mockMembers = [
        { id: "membership-1", userId: mockUserId, troupeId: mockTroupeId },
      ];

      // Mock troupe lookup
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockTroupe]),
          }),
        }),
      });

      // Mock membership check
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: "membership-1" }]),
          }),
        }),
      });

      // Mock members list
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockMembers),
        }),
      });

      const request = new NextRequest(`http://localhost/api/troupes/${mockTroupeId}`);
      const response = await GETById(request, { params: Promise.resolve({ id: mockTroupeId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("troupe");
      expect(data.troupe).toHaveProperty("id");
      expect(data.troupe.isDirector).toBe(true);
      expect(data.troupe.members).toEqual(mockMembers);
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 401 when not authenticated", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/troupes/${mockTroupeId}`);
      const response = await GETById(request, { params: Promise.resolve({ id: mockTroupeId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("DELETE /api/troupes/[id]", () => {
    it("should return 200 when director deletes troupe", async () => {
      (deleteTroupe as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest(`http://localhost/api/troupes/${mockTroupeId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: mockTroupeId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("status", 200);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 403 when non-director tries to delete", async () => {
      (deleteTroupe as jest.Mock).mockRejectedValue(
        new Error("Only the director can delete a troupe")
      );

      const request = new NextRequest(`http://localhost/api/troupes/${mockTroupeId}`, {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: mockTroupeId }) });
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

      (approveMember as jest.Mock).mockResolvedValue(mockMembership);

      const request = new NextRequest(`http://localhost/api/troupes/${mockTroupeId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: mockMemberId }),
      });
      const response = await POSTMember(request, { params: Promise.resolve({ id: mockTroupeId }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("membership");
      expect(data).toHaveProperty("status", 201);
      expect(data).toHaveProperty("ok", true);
    });

    it("should return 403 when non-director tries to approve", async () => {
      (approveMember as jest.Mock).mockRejectedValue(
        new Error("Only the director can approve members")
      );

      const request = new NextRequest(`http://localhost/api/troupes/${mockTroupeId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: mockMemberId }),
      });
      const response = await POSTMember(request, { params: Promise.resolve({ id: mockTroupeId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty("error", "Forbidden");
    });
  });

  describe("DELETE /api/troupes/[id]/members/[userId]", () => {
    it("should return 200 when director removes member", async () => {
      (removeMember as jest.Mock).mockResolvedValue(undefined);

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
      (removeMember as jest.Mock).mockRejectedValue(
        new Error("Only a troupe manager can remove members")
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

