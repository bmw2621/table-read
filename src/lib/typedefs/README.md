# API Type Definitions

This directory contains TypeScript type definitions for all API route responses. These types make it easier to work with API responses throughout the codebase with full type safety.

## Usage

### Importing Types

```typescript
import type {
  GetTroupesResponse,
  CreateTroupeResponse,
  GetTroupeResponse,
  TroupeWithCount,
  TroupeWithMembers,
  UserPublic,
} from "@/lib/typedefs";
```

### Example: Using Types in API Calls

```typescript
// In a client component or server action
async function fetchTroupes(): Promise<GetTroupesResponse> {
  const response = await fetch("/api/troupes");
  const data: GetTroupesResponse = await response.json();
  return data;
}

// Type-safe access to response data
const troupes = data.troupes; // Type: TroupeWithCount[]
const firstTroupe = data.troupes[0];
console.log(firstTroupe.isDirector); // Type: boolean
console.log(firstTroupe.memberCount); // Type: number
```

### Example: Using Types in API Routes

```typescript
import type { GetTroupesResponse } from "@/lib/typedefs";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<GetTroupesResponse>> {
  // ... implementation
  return NextResponse.json({
    troupes: troupesWithCounts,
    status: 200,
    ok: true,
  });
}
```

## Available Types

### Base Types
- `Troupe` - Base troupe entity from database
- `TroupeMembership` - Base membership entity from database
- `User` - Base user entity from database
- `UserPublic` - Public user data (excludes sensitive fields like password)

### Extended Types
- `TroupeWithCount` - Troupe with `isDirector` and `memberCount` fields
- `TroupeWithMembers` - Troupe with `isDirector` and `members` array

### API Response Types
- `GetTroupesResponse` - GET /api/troupes
- `CreateTroupeResponse` - POST /api/troupes
- `GetTroupeResponse` - GET /api/troupes/[id]
- `DeleteTroupeResponse` - DELETE /api/troupes/[id]
- `ApproveMemberResponse` - POST /api/troupes/[id]/members
- `RemoveMemberResponse` - DELETE /api/troupes/[id]/members/[userId]
- `SignupResponse` - POST /api/auth/signup

### Utility Types
- `ApiResponse<T>` - Base response structure with `status` and `ok` fields
- `ApiErrorResponse` - Standard error response structure
- `ApiSuccessResponse` - Union of all successful API responses

## Adding New Types

When adding a new API route that returns data:

1. Add the response type to `api.ts` following the naming convention: `[Method][Route]Response`
2. Export it from `index.ts`
3. Update this README with the new type

Example:
```typescript
// In api.ts
export type GetScriptsResponse = ApiResponse<{
  scripts: Script[];
}>;

// In index.ts (already exports everything from api.ts)
// No changes needed
```

