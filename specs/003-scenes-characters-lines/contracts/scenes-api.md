# API Contracts: Scene Management

**Feature**: Script Content Data Model - Scenes  
**Date**: 2025-12-12  
**Base URL**: `/api/scripts/[id]/scenes`

## Overview

Scene management API for creating and accessing scenes within a script. Scenes provide organizational structure for script content. Access control inherits from script access - users who can access a script can access its scenes.

## Routes

### GET /api/scripts/[id]/scenes

List all scenes for a script. Requires user to have access to the script (FR-018).

**Path Parameters**:
- `id` (string, required) - Script identifier

**Query Parameters**: None

**Request**: No body required

**Response** (Success - 200 OK):
```typescript
{
  scenes: Array<{
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

**Note**: Performance target: <500ms for up to 100 scenes (SC-004). Supports scripts with up to 200 scenes (SC-010).

---

### POST /api/scripts/[id]/scenes

Create a new scene in a script. Requires user to have access to the script (FR-001, FR-002).

**Path Parameters**:
- `id` (string, required) - Script identifier

**Request**: No body required (scene has no attributes beyond script association)

**Response** (Success - 201 Created):
```typescript
{
  scene: {
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

**Note**: Performance target: <1 second for scene creation (SC-001).

---

## Access Control

- Scene access inherits from script access (FR-018)
- Users who can access a script can create, list, and access its scenes
- Access is determined by: direct script ownership OR troupe membership (for troupe-owned scripts)

---

## Error Codes

- `400 Bad Request` - Validation errors (invalid script ID, etc.)
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - User does not have access to the script
- `404 Not Found` - Script not found
- `500 Internal Server Error` - Unexpected errors

