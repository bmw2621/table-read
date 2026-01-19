import { InferSelectModel } from "drizzle-orm";
import { troupes, troupeMemberships, users, scripts, scenes, characters, lines } from "@/lib/db/schema";

/**
 * Base database entity types
 */
export type Troupe = InferSelectModel<typeof troupes>;
export type TroupeMembership = InferSelectModel<typeof troupeMemberships>;
export type User = InferSelectModel<typeof users>;
export type Script = InferSelectModel<typeof scripts>;
export type Scene = InferSelectModel<typeof scenes>;
export type Character = InferSelectModel<typeof characters>;
export type Line = InferSelectModel<typeof lines>;

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

export type ScriptWithOwnerType = Script & {
  ownerType: "user" | "troupe";
};

export type ScriptWithAccess = Script & {
  ownerType: "user" | "troupe";
  canEdit: boolean;
};

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
 * Script API Response Types
 */

/**
 * GET /api/scripts
 * Returns a list of scripts accessible to the user
 */
export type GetScriptsResponse = ApiResponse<{
  scripts: ScriptWithOwnerType[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}>;

/**
 * POST /api/scripts
 * Creates a new script
 */
export type CreateScriptResponse = ApiResponse<{
  script: Script;
}>;

/**
 * GET /api/scripts/[id]
 * Returns a single script with access information
 */
export type GetScriptResponse = ApiResponse<{
  script: ScriptWithAccess;
}>;

/**
 * PUT /api/scripts/[id]
 * Updates a script
 */
export type UpdateScriptResponse = ApiResponse<{
  script: Script;
}>;

/**
 * DELETE /api/scripts/[id]
 * Deletes a script
 */
export type DeleteScriptResponse = ApiResponse<{
  message: string;
}>;

/**
 * Scene API Response Types
 */

/**
 * GET /api/scripts/[id]/scenes
 * Returns a list of scenes for a script
 */
export type GetScenesResponse = ApiResponse<{
  scenes: Scene[];
}>;

/**
 * POST /api/scripts/[id]/scenes
 * Creates a new scene in a script
 */
export type CreateSceneResponse = ApiResponse<{
  scene: Scene;
}>;

/**
 * Character API Response Types
 */

/**
 * GET /api/scripts/[id]/characters
 * Returns a list of characters for a script
 */
export type GetCharactersResponse = ApiResponse<{
  characters: Character[];
}>;

/**
 * POST /api/scripts/[id]/characters
 * Creates a new character in a script
 */
export type CreateCharacterResponse = ApiResponse<{
  character: Character;
}>;

/**
 * Line API Response Types
 */

/**
 * GET /api/scenes/[id]/lines
 * Returns a list of lines for a scene
 */
export type GetLinesResponse = ApiResponse<{
  lines: Line[];
}>;

/**
 * POST /api/scenes/[id]/lines
 * Creates a new line in a scene
 */
export type CreateLineResponse = ApiResponse<{
  line: Line;
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
  | GetScriptsResponse
  | CreateScriptResponse
  | GetScriptResponse
  | UpdateScriptResponse
  | DeleteScriptResponse
  | GetScenesResponse
  | CreateSceneResponse
  | GetCharactersResponse
  | CreateCharacterResponse
  | GetLinesResponse
  | CreateLineResponse
  | SignupResponse;

