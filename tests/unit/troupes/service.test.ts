import {
  createTroupe,
  approveMember,
  removeMember,
  deleteTroupe,
} from "@/lib/troupes/service";
import { db } from "@/lib/db";
import { troupes, troupeMemberships } from "@/lib/db/schema";

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock permissions
jest.mock("@/lib/troupes/permissions", () => ({
  isDirector: jest.fn(),
  canManageTroupe: jest.fn(),
}));

import { isDirector } from "@/lib/troupes/permissions";
import { canManageTroupe } from "@/lib/troupes/permissions";

describe("Troupe Service", () => {
  const mockDirectorId = "director-123";
  const mockTroupeId = "troupe-456";
  const mockUserId = "user-789";
  const mockMembershipId = "membership-101";

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset db.delete mock to return proper chainable object
    (db.delete as jest.Mock).mockImplementation(() => ({
      where: jest.fn().mockResolvedValue(undefined),
    }));
    
    // Reset db.insert mock to return proper chainable object
    (db.insert as jest.Mock).mockImplementation(() => ({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    }));
  });

  describe("createTroupe", () => {
    it("should create troupe and add director as first member", async () => {
      const mockTroupe = {
        id: mockTroupeId,
        directorId: mockDirectorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInsertTroupe = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockTroupe]),
        }),
      });

      const mockInsertMembership = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertTroupe(troupes))
        .mockReturnValueOnce(mockInsertMembership(troupeMemberships));

      const result = await createTroupe(mockDirectorId);

      expect(result).toEqual(mockTroupe);
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe("approveMember", () => {
    it("should approve member when director calls it", async () => {
      (canManageTroupe as jest.Mock).mockResolvedValue(true);

      const mockExistingCheck = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // No existing membership
          }),
        }),
      };

      const mockMembership = {
        id: mockMembershipId,
        userId: mockUserId,
        troupeId: mockTroupeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Override the default mock for this test to return the membership
      (db.insert as jest.Mock).mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockMembership]),
        }),
      });

      (db.select as jest.Mock).mockReturnValue(mockExistingCheck);

      const result = await approveMember(mockTroupeId, mockUserId, mockDirectorId);

      expect(result).toEqual(mockMembership);
      expect(canManageTroupe).toHaveBeenCalledWith(mockDirectorId, mockTroupeId);
    });

    it("should throw error when non-director tries to approve", async () => {
      (canManageTroupe as jest.Mock).mockResolvedValue(false);

      await expect(
        approveMember(mockTroupeId, mockUserId, "non-director-id")
      ).rejects.toThrow("Only the director can approve members");
    });

    it("should throw error when user is already a member", async () => {
      (canManageTroupe as jest.Mock).mockResolvedValue(true);

      const mockExistingMembership = {
        id: mockMembershipId,
        userId: mockUserId,
        troupeId: mockTroupeId,
      };

      const mockExistingCheck = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockExistingMembership]),
          }),
        }),
      };

      (db.select as jest.Mock).mockReturnValue(mockExistingCheck);

      await expect(
        approveMember(mockTroupeId, mockUserId, mockDirectorId)
      ).rejects.toThrow("User is already a member");
    });
  });

  describe("removeMember", () => {
    it("should remove member when manager calls it", async () => {
      (isDirector as jest.Mock).mockResolvedValue(true); // Director is director
      (canManageTroupe as jest.Mock).mockResolvedValue(true); // Director can manage

      await removeMember(mockTroupeId, mockUserId, mockDirectorId);

      expect(isDirector).toHaveBeenCalledWith(mockDirectorId, mockTroupeId);
      expect(canManageTroupe).toHaveBeenCalledWith(mockDirectorId, mockTroupeId);
      expect(db.delete).toHaveBeenCalledWith(troupeMemberships);
    });

    it("should allow user to remove themselves", async () => {
      (isDirector as jest.Mock).mockResolvedValue(false); // User is not director
      (canManageTroupe as jest.Mock).mockResolvedValue(false); // User is not manager

      await removeMember(mockTroupeId, mockUserId, mockUserId);

      // Should check if user is director, but allow removal since they're not director
      expect(isDirector).toHaveBeenCalledWith(mockUserId, mockTroupeId);
      expect(canManageTroupe).toHaveBeenCalledWith(mockUserId, mockTroupeId);
      expect(db.delete).toHaveBeenCalledWith(troupeMemberships);
    });

    it("should prevent director from removing themselves", async () => {
      (isDirector as jest.Mock).mockResolvedValue(true);

      await expect(
        removeMember(mockTroupeId, mockDirectorId, mockDirectorId)
      ).rejects.toThrow("Director cannot remove themselves");
    });

    it("should throw error when non-director tries to remove someone else", async () => {
      (isDirector as jest.Mock).mockResolvedValue(false); // Not director
      (canManageTroupe as jest.Mock).mockResolvedValue(false); // Cannot manage

      await expect(
        removeMember(mockTroupeId, mockUserId, "non-director-id")
      ).rejects.toThrow("Only a troupe manager can remove members");
      
      expect(isDirector).toHaveBeenCalledWith("non-director-id", mockTroupeId);
      expect(canManageTroupe).toHaveBeenCalledWith("non-director-id", mockTroupeId);
    });
  });

  describe("deleteTroupe", () => {
    it("should delete troupe when director calls it", async () => {
      (isDirector as jest.Mock).mockResolvedValue(true);

      await deleteTroupe(mockTroupeId, mockDirectorId);

      expect(isDirector).toHaveBeenCalledWith(mockDirectorId, mockTroupeId);
      expect(db.delete).toHaveBeenCalledWith(troupes);
    });

    it("should throw error when non-director tries to delete", async () => {
      (isDirector as jest.Mock).mockResolvedValue(false);

      await expect(
        deleteTroupe(mockTroupeId, "non-director-id")
      ).rejects.toThrow("Only the director can delete a troupe");
    });
  });
});

