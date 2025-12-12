import { InferSelectModel } from "drizzle-orm";
import { troupes, troupeMemberships, users } from "@/lib/db/schema";

/**
 * Base database entity types
 */
export type Troupe = InferSelectModel<typeof troupes>;
export type TroupeMembership = InferSelectModel<typeof troupeMemberships>;
export type User = InferSelectModel<typeof users>;

/**
 * Extended types for API responses
 */
export type TroupeWithCount = Troupe & {
  isDirector: boolean;
  memberCount: number;
};

export type TroupeWithMembers = Troupe & {
  isDirector: boolean;
  members: TroupeMembership[];
};

export type UserPublic = Pick<User, "id" | "username" | "name" | "email" | "createdAt">;

/**
 * Base API response structure
 */
export type ApiResponse<T = unknown> = {
  status: number;
  ok: boolean;
} & T;

export type ApiErrorResponse = {
  error: string;
  message: string;
  status: number;
  ok: false;
  errors?: string[];
};

/**
 * Troupe API Response Types
 */

/**
 * GET /api/troupes
 * Returns a list of troupes the user is a member of
 */
export type GetTroupesResponse = ApiResponse<{
  troupes: TroupeWithCount[];
}>;

/**
 * POST /api/troupes
 * Creates a new troupe
 */
export type CreateTroupeResponse = ApiResponse<{
  troupe: Troupe;
}>;

/**
 * GET /api/troupes/[id]
 * Returns a single troupe with its members
 */
export type GetTroupeResponse = ApiResponse<{
  troupe: TroupeWithMembers;
}>;

/**
 * DELETE /api/troupes/[id]
 * Deletes a troupe
 */
export type DeleteTroupeResponse = ApiResponse<{
  message: string;
}>;

/**
 * POST /api/troupes/[id]/members
 * Approves a user to join a troupe
 */
export type ApproveMemberResponse = ApiResponse<{
  membership: TroupeMembership;
}>;

/**
 * DELETE /api/troupes/[id]/members/[userId]
 * Removes a member from a troupe
 */
export type RemoveMemberResponse = ApiResponse<{
  message: string;
}>;

/**
 * Auth API Response Types
 */

/**
 * POST /api/auth/signup
 * Creates a new user account
 */
export type SignupResponse = ApiResponse<{
  user: UserPublic;
}>;

/**
 * Union type for all successful API responses
 */
export type ApiSuccessResponse =
  | GetTroupesResponse
  | CreateTroupeResponse
  | GetTroupeResponse
  | DeleteTroupeResponse
  | ApproveMemberResponse
  | RemoveMemberResponse
  | SignupResponse;

