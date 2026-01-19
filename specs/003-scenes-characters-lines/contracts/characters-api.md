# API Contracts: Character Management

**Feature**: Script Content Data Model - Characters  
**Date**: 2025-12-12  
**Base URL**: `/api/scripts/[id]/characters`

## Overview

Character management API for creating and accessing characters within a script. Characters represent speakers in the script and are associated with dialogue lines. Access control inherits from script access - users who can access a script can access its characters.

## Routes

### GET /api/scripts/[id]/characters

List all characters for a script. Requires user to have access to the script (FR-019).

**Path Parameters**:
- `id` (string, required) - Script identifier

**Query Parameters**: None

**Request**: No body required

**Response** (Success - 200 OK):
```typescript
{
  characters: Array<{
    id: string;
    scriptId: string;
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
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

**Note**: Performance target: <500ms for up to 50 characters (SC-005). Supports scripts with up to 100 characters (SC-011).

---

### POST /api/scripts/[id]/characters

Create a new character in a script. Requires user to have access to the script (FR-004, FR-005).

**Path Parameters**:
- `id` (string, required) - Script identifier

**Request**: No body required (character has no attributes beyond script association)

**Response** (Success - 201 Created):
```typescript
{
  character: {
    id: string;
    scriptId: string;
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
  message: string; // e.g., "Script not found" or "Invalid script ID"
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

**Note**: Performance target: <1 second for character creation (SC-002).

---

## Access Control

- Character access inherits from script access (FR-019)
- Users who can access a script can create, list, and access its characters
- Access is determined by: direct script ownership OR troupe membership (for troupe-owned scripts)

---

## Error Codes

- `400 Bad Request` - Validation errors (invalid script ID, etc.)
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - User does not have access to the script
- `404 Not Found` - Script not found
- `500 Internal Server Error` - Unexpected errors

