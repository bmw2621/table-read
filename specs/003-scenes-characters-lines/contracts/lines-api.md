# API Contracts: Line Management

**Feature**: Script Content Data Model - Lines  
**Date**: 2025-12-12  
**Base URL**: `/api/scenes/[id]/lines`

## Overview

Line management API for creating and accessing dialogue lines within scenes. Each line contains text content and belongs to a scene. Lines may optionally be associated with a character (speaker). When a character is provided, both character and scene must belong to the same script for referential integrity. Access control inherits from script access - users who can access a script can access its lines.

## Routes

### GET /api/scenes/[id]/lines

List all lines for a scene. Requires user to have access to the parent script (FR-020).

**Path Parameters**:

- `id` (string, required) - Scene identifier

**Query Parameters**: None

**Request**: No body required

**Response** (Success - 200 OK):

```typescript
{
  lines: Array<{
    id: string;
    text: string;
    characterId: string | null; // Optional character association
    sceneId: string;
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
  message: "You do not have access to this scene's script";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):

```typescript
{
  error: "NotFound";
  message: "Scene not found";
  status: 404;
  ok: false;
}
```

**Note**: Performance target: <1 second for up to 500 lines (SC-006). Supports scenes with up to 1000 lines (SC-012).

---

### POST /api/scenes/[id]/lines

Create a new line in a scene. Requires user to have access to the parent script. Character is optional - if provided, character and scene must belong to the same script (FR-007, FR-008, FR-009, FR-010, FR-012, FR-013).

**Path Parameters**:

- `id` (string, required) - Scene identifier

**Request**:

```typescript
{
  text: string; // Required, non-empty dialogue text
  characterId?: string; // Optional, character who speaks this line
}
```

**Response** (Success - 201 Created):

```typescript
{
  line: {
    id: string;
    text: string;
    characterId: string | null; // Optional character association
    sceneId: string;
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
  }
  status: 201;
  ok: true;
}
```

**Response** (Error - 400 Bad Request):

```typescript
{
  error: "ValidationError";
  message: string; // e.g., "Text is required", "Character and scene must belong to the same script"
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
  message: "You do not have access to this scene's script";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):

```typescript
{
  error: "NotFound";
  message: "Scene not found" | "Character not found";
  status: 404;
  ok: false;
}
```

**Response** (Error - 409 Conflict):

```typescript
{
  error: "Conflict";
  message: "Character and scene must belong to the same script";
  status: 409;
  ok: false;
}
```

**Note**: Performance target: <1 second for line creation (SC-003). When characterId is provided, validation must ensure character and scene belong to the same script (FR-012, FR-013).
status: 201;
ok: true;
}

````

**Response** (Error - 400 Bad Request):
```typescript
{
  error: "ValidationError";
  message: string; // e.g., "Text is required", "Character ID is required", "Character and scene must belong to the same script"
  status: 400;
  ok: false;
}
````

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
  message: "You do not have access to this scene's script";
  status: 403;
  ok: false;
}
```

**Response** (Error - 404 Not Found):

```typescript
{
  error: "NotFound";
  message: "Scene not found" | "Character not found";
  status: 404;
  ok: false;
}
```

**Response** (Error - 409 Conflict):

```typescript
{
  error: "Conflict";
  message: "Character and scene must belong to the same script";
  status: 409;
  ok: false;
}
```

**Note**: Performance target: <1 second for line creation (SC-003). Validation must ensure character and scene belong to the same script (FR-012, FR-013).

---

## Access Control

- Line access inherits from script access (FR-020)
- Users who can access a script can create, list, and access its lines
- Access is determined by: direct script ownership OR troupe membership (for troupe-owned scripts)
- Before creating a line, system verifies user has access to the scene's script. If characterId is provided, system also verifies access to the character's script

---

## Error Codes

- `400 Bad Request` - Validation errors (missing text, invalid character ID, etc.)
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - User does not have access to the scene's script
- `404 Not Found` - Scene or character not found
- `409 Conflict` - Referential integrity violation (character/scene don't belong to same script)
- `500 Internal Server Error` - Unexpected errors

---

## Validation Rules

- `text` is required and cannot be empty (FR-010)
- `characterId` is optional - if provided, must reference a valid character (FR-009)
- `sceneId` (from path) must reference a valid scene (FR-007)
- When `characterId` is provided, character and scene must belong to the same script (FR-012, FR-013) - application-level check
- User must have access to the parent script before creating line
