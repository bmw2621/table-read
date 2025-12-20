# API Contracts: Troupe Management

**Feature**: Troupe and Script Data Models  
**Date**: 2025-12-12  
**Base URL**: `/api/troupes`

## Overview

Troupe management API for creating troupes, managing memberships, and accessing troupe information. All endpoints require authentication. Director-only operations are enforced at the application layer.

## Routes

### GET /api/troupes

List all troupes the authenticated user belongs to (as director or member).

**Request**: No body required

**Response** (Success - 200 OK):
```typescript
{
  troupes: Array<{
    id: string;
    directorId: string;
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
    isDirector: boolean; // Whether current user is director
    memberCount: number; // Number of members in troupe
  }>;
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

---

### POST /api/troupes

Create a new troupe. The authenticated user becomes the director and is automatically added as the first member.

**Request**:
```typescript
{
  // No body required - troupe created with minimal data
}
```

**Response** (Success - 201 Created):
```typescript
{
  troupe: {
    id: string;
    directorId: string;
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
  };
  status: 201;
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

**Note**: Director is automatically added as first member (FR-002).

---

### GET /api/troupes/[id]

Get troupe details including member list.

**Request**: No body required

**Response** (Success - 200 OK):
```typescript
{
  troupe: {
    id: string;
    directorId: string;
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
    isDirector: boolean; // Whether current user is director
    members: Array<{
      id: string;
      userId: string;
      joinedAt: string; // ISO 8601 timestamp
    }>;
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
  message: "You are not a member of this troupe";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):
```typescript
{
  error: "NotFound";
  message: "Troupe not found";
  status: 404;
  ok: false;
}
```

**Note**: Only troupe members can view troupe details (FR-011).

---

### DELETE /api/troupes/[id]

Delete a troupe. Only the director can delete a troupe (FR-006).

**Request**: No body required

**Response** (Success - 200 OK):
```typescript
{
  message: "Troupe deleted successfully";
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
  message: "Only the director can delete a troupe";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):
```typescript
{
  error: "NotFound";
  message: "Troupe not found";
  status: 404;
  ok: false;
}
```

**Note**: Deleting a troupe cascades to memberships. Script ownership behavior TBD (research.md).

---

### POST /api/troupes/[id]/members

Approve a user to join the troupe. Only the director can approve new members (FR-004).

**Request**:
```typescript
{
  userId: string; // Required, user ID to approve
}
```

**Response** (Success - 201 Created):
```typescript
{
  membership: {
    id: string;
    userId: string;
    troupeId: string;
    createdAt: string; // ISO 8601 timestamp
  };
  status: 201;
  ok: true;
}
```

**Response** (Error - 400 Bad Request):
```typescript
{
  error: "ValidationError" | "DuplicateMembership";
  message: string; // e.g., "User is already a member" or "Invalid user ID"
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
  message: "Only the director can approve new members";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):
```typescript
{
  error: "NotFound";
  message: "Troupe not found";
  status: 404;
  ok: false;
}
```

**Validation Rules**:
- `userId` must be a valid user ID
- User must not already be a member (FR-013)
- Director cannot approve themselves (already a member)

---

### DELETE /api/troupes/[id]/members/[userId]

Remove a member from the troupe. Only the director can remove members (FR-005).

**Request**: No body required

**Response** (Success - 200 OK):
```typescript
{
  message: "Member removed successfully";
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
  message: "Only the director can remove members" | "Director cannot remove themselves";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):
```typescript
{
  error: "NotFound";
  message: "Troupe not found" | "Membership not found";
  status: 404;
  ok: false;
}
```

**Validation Rules**:
- Director cannot remove themselves (edge case FR-007)
- User must be a member of the troupe

---

## Error Handling

All endpoints follow consistent error handling:

1. **Validation Errors** (400): Invalid input data or duplicate membership
2. **Authentication Errors** (401): Not authenticated
3. **Authorization Errors** (403): Not authorized (non-director attempting director-only operation)
4. **Not Found** (404): Troupe or membership not found
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
2. **Permission Enforcement**: Director-only operations enforced at application layer
3. **Input Validation**: All inputs validated via Zod schemas
4. **Information Disclosure**: Generic error messages for security
5. **CSRF Protection**: State-changing operations require CSRF token (via Next.js)

## Status Codes

- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or validation error
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but not authorized (non-director)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Performance Considerations

- List endpoint should support pagination if user belongs to 50+ troupes (SC-005)
- Member list queries optimized with indexes (SC-006: 100+ members)
- Response times: <2 seconds for member management (SC-008)

