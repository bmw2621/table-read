# API Contracts: Script Management

**Feature**: Troupe and Script Data Models  
**Date**: 2025-12-12  
**Base URL**: `/api/scripts`

## Overview

Script management API for creating, accessing, and managing scripts. Scripts can be owned by users (personal) or troupes (shared). Access control is enforced based on ownership and troupe membership.

## Routes

### GET /api/scripts

List all scripts accessible to the authenticated user. Returns user-owned scripts plus scripts from all troupes the user belongs to (FR-011).

**Query Parameters**:
- `ownerType?: "user" | "troupe"` - Filter by ownership type
- `troupeId?: string` - Filter by specific troupe
- `limit?: number` - Pagination limit (default: 100)
- `offset?: number` - Pagination offset (default: 0)

**Request**: No body required

**Response** (Success - 200 OK):
```typescript
{
  scripts: Array<{
    id: string;
    title: string;
    userId: string | null;
    troupeId: string | null;
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
    ownerType: "user" | "troupe";
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  status: 200;
  ok: true;
}
```

**Response** (Error - 401 Unauthorized):
```typescript
{
  error: "Unauthorized";
  status: 401;
  ok: false;
}
```

**Note**: Returns union of user-owned scripts + troupe-owned scripts (where user is member). Performance target: <1 second for up to 1000 scripts (SC-007).

---

### POST /api/scripts

Create a new script. Can be owned by the authenticated user or by a troupe the user belongs to (FR-009).

**Request**:
```typescript
{
  title: string; // Required, non-empty
  troupeId?: string; // Optional, if provided, script owned by troupe
  // If troupeId not provided, script owned by authenticated user
}
```

**Response** (Success - 201 Created):
```typescript
{
  script: {
    id: string;
    title: string;
    userId: string | null;
    troupeId: string | null;
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
  };
  status: 201;
  ok: true;
}
```

**Response** (Error - 400 Bad Request):
```typescript
{
  error: "ValidationError";
  message: string; // e.g., "Title is required" or "Title cannot be empty"
  status: 400;
  ok: false;
}
```

**Response** (Error - 401 Unauthorized):
```typescript
{
  error: "Unauthorized";
  status: 401;
  ok: false;
}
```

**Response** (Error - 403 Forbidden):
```typescript
{
  error: "Forbidden";
  message: "You are not a member of this troupe";
  status: 403;
  ok: false;
}
```

**Validation Rules**:
- `title` is required and cannot be empty (FR-014)
- If `troupeId` provided, user must be a member of that troupe (FR-015)
- Exactly one of `userId` or `troupeId` will be set (mutually exclusive)

**Performance Target**: <3 seconds for script creation (SC-002).

---

### GET /api/scripts/[id]

Get script details. User must own the script or be a member of the troupe that owns it (FR-010, FR-011, FR-012).

**Request**: No body required

**Response** (Success - 200 OK):
```typescript
{
  script: {
    id: string;
    title: string;
    userId: string | null;
    troupeId: string | null;
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
    ownerType: "user" | "troupe";
    canEdit: boolean; // Whether current user can edit (owner only)
  };
  status: 200;
  ok: true;
}
```

**Response** (Error - 401 Unauthorized):
```typescript
{
  error: "Unauthorized";
  status: 401;
  ok: false;
}
```

**Response** (Error - 403 Forbidden):
```typescript
{
  error: "Forbidden";
  message: "You do not have access to this script";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):
```typescript
{
  error: "NotFound";
  message: "Script not found";
  status: 404;
  ok: false;
}
```

**Access Control**:
- User-owned scripts: Accessible only to the owning user
- Troupe-owned scripts: Accessible to all members of the troupe
- Access denied if user is not owner and not a member of owning troupe

---

### PUT /api/scripts/[id]

Update a script. Only the owner can update (user for user-owned, any troupe member for troupe-owned - future: may restrict to director).

**Request**:
```typescript
{
  title: string; // Required, non-empty
}
```

**Response** (Success - 200 OK):
```typescript
{
  script: {
    id: string;
    title: string;
    userId: string | null;
    troupeId: string | null;
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
  };
  status: 200;
  ok: true;
}
```

**Response** (Error - 400 Bad Request):
```typescript
{
  error: "ValidationError";
  message: string; // e.g., "Title is required"
  status: 400;
  ok: false;
}
```

**Response** (Error - 401 Unauthorized):
```typescript
{
  error: "Unauthorized";
  status: 401;
  ok: false;
}
```

**Response** (Error - 403 Forbidden):
```typescript
{
  error: "Forbidden";
  message: "Only the owner can update this script";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):
```typescript
{
  error: "NotFound";
  message: "Script not found";
  status: 404;
  ok: false;
}
```

**Note**: For troupe-owned scripts, any troupe member can update (may be restricted to director in future).

---

### DELETE /api/scripts/[id]

Delete a script. Only the owner can delete.

**Request**: No body required

**Response** (Success - 200 OK):
```typescript
{
  message: "Script deleted successfully";
  status: 200;
  ok: true;
}
```

**Response** (Error - 401 Unauthorized):
```typescript
{
  error: "Unauthorized";
  status: 401;
  ok: false;
}
```

**Response** (Error - 403 Forbidden):
```typescript
{
  error: "Forbidden";
  message: "Only the owner can delete this script";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):
```typescript
{
  error: "NotFound";
  message: "Script not found";
  status: 404;
  ok: false;
}
```

---

## Error Handling

All endpoints follow consistent error handling:

1. **Validation Errors** (400): Invalid input data (e.g., empty title)
2. **Authentication Errors** (401): Not authenticated
3. **Authorization Errors** (403): Not authorized (no access to script or not owner)
4. **Not Found** (404): Script not found
5. **Server Errors** (500): Internal server error

**Error Response Format**:
```typescript
{
  error: string;        // Error code
  message?: string;     // User-friendly message
  status: number;       // HTTP status code
  ok: boolean;          // Always false for errors
}
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid session
2. **Access Control**: Script access determined by ownership + troupe membership
3. **Input Validation**: All inputs validated via Zod schemas
4. **Information Disclosure**: Generic error messages for security
5. **CSRF Protection**: State-changing operations require CSRF token (via Next.js)

## Status Codes

- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or validation error
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but not authorized (no access)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Performance Considerations

- List endpoint optimized for <1 second response time for up to 1000 scripts (SC-007)
- Queries join scripts with troupe memberships efficiently
- Pagination support for large result sets
- Indexes on `userId` and `troupeId` for fast queries

## Access Control Logic

**Script Access Determination**:
1. If `script.userId === currentUserId`: User has access (owner)
2. If `script.troupeId` exists: Check if user is member of that troupe
3. If user is member: User has access
4. Otherwise: Access denied (403 Forbidden)

**Implementation**: Query joins `scripts` with `troupeMemberships` to determine access efficiently.

