# API Contracts: User Authentication

**Feature**: User Authentication  
**Date**: 2025-12-10  
**Base URL**: `/api/auth`

## Overview

Authentication is handled via Auth.js (NextAuth.js) which provides a standardized authentication API. The main entry point is the catch-all route that handles all authentication operations.

## Routes

### POST /api/auth/signin

Sign in with username and password.

**Request**:
```typescript
{
  username: string;  // Required, unique username
  password: string;  // Required, user's password
  redirect?: boolean; // Optional, default: true
  callbackUrl?: string; // Optional, URL to redirect after sign in
}
```

**Response** (Success - 200 OK):
```typescript
{
  url?: string; // Redirect URL if redirect=true
  error?: null;
  status: 200;
  ok: true;
}
```

**Response** (Error - 401 Unauthorized):
```typescript
{
  error: "CredentialsSignin" | "InvalidCredentials";
  status: 401;
  ok: false;
}
```

**Error Messages** (Generic for security - per FR-012):
- "Invalid username or password" (does not reveal if username exists)

**Validation**:
- Username: Required, non-empty string
- Password: Required, non-empty string

---

### POST /api/auth/signup

Register a new user account.

**Request**:
```typescript
{
  username: string;  // Required, unique username
  password: string;  // Required, must meet security requirements
  name?: string;     // Optional, display name
  email?: string;    // Optional, email address
}
```

**Response** (Success - 201 Created):
```typescript
{
  user: {
    id: string;
    username: string;
    name?: string;
    email?: string;
    createdAt: string; // ISO 8601 timestamp
  };
  status: 201;
  ok: true;
}
```

**Response** (Error - 400 Bad Request):
```typescript
{
  error: "ValidationError" | "UsernameTaken" | "WeakPassword";
  message: string; // User-friendly error message
  status: 400;
  ok: false;
}
```

**Error Messages**:
- "Username is already taken" (FR-002)
- "Password does not meet security requirements" (FR-003)
- "Username is required"
- "Password is required"

**Validation Rules**:
- Username: Required, unique, non-empty, alphanumeric + underscore/hyphen (TBD in implementation)
- Password: Required, minimum length (TBD), complexity requirements (TBD)

---

### POST /api/auth/signout

Sign out the current user and terminate their session.

**Request**:
```typescript
{
  redirect?: boolean; // Optional, default: true
  callbackUrl?: string; // Optional, URL to redirect after sign out
}
```

**Response** (Success - 200 OK):
```typescript
{
  url?: string; // Redirect URL if redirect=true
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

**Note**: If user is not authenticated, returns 401.

---

### GET /api/auth/session

Get the current user's session.

**Request**: No body required

**Response** (Authenticated - 200 OK):
```typescript
{
  user: {
    id: string;
    username: string;
    name?: string;
    email?: string;
    image?: string;
  };
  expires: string; // ISO 8601 timestamp
  status: 200;
  ok: true;
}
```

**Response** (Unauthenticated - 401 Unauthorized):
```typescript
{
  user: null;
  expires: null;
  status: 401;
  ok: false;
}
```

---

### GET /api/auth/csrf

Get CSRF token for form submissions.

**Request**: No body required

**Response** (200 OK):
```typescript
{
  csrfToken: string;
  status: 200;
  ok: true;
}
```

---

## Auth.js Catch-All Route

### GET/POST /api/auth/[...nextauth]

Auth.js catch-all route that handles all authentication operations. This route supports multiple endpoints:

- `/api/auth/signin` - Sign in page/endpoint
- `/api/auth/signout` - Sign out endpoint
- `/api/auth/session` - Get current session
- `/api/auth/csrf` - Get CSRF token
- `/api/auth/providers` - List available providers
- `/api/auth/callback/[provider]` - OAuth callback (future)

**Implementation**: Handled automatically by Auth.js. Custom endpoints above may be implemented as Next.js API routes or server actions.

---

## Server Actions (Alternative Implementation)

If using Next.js Server Actions instead of API routes:

### signIn(username: string, password: string)

Server action for signing in.

**Parameters**:
- `username`: string (required)
- `password`: string (required)

**Returns**: `Promise<{ success: boolean; error?: string; redirect?: string }>`

---

### signUp(username: string, password: string, name?: string)

Server action for user registration.

**Parameters**:
- `username`: string (required, unique)
- `password`: string (required, meets security requirements)
- `name`: string (optional)

**Returns**: `Promise<{ success: boolean; user?: User; error?: string }>`

---

### signOut()

Server action for signing out.

**Returns**: `Promise<{ success: boolean; redirect?: string }>`

---

## Error Handling

All endpoints follow consistent error handling:

1. **Validation Errors** (400): Invalid input data
2. **Authentication Errors** (401): Invalid credentials or unauthenticated
3. **Authorization Errors** (403): Authenticated but not authorized (future)
4. **Not Found** (404): Resource not found
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

1. **CSRF Protection**: All state-changing operations require CSRF token
2. **Rate Limiting**: (Future) Implement rate limiting for sign in attempts
3. **Password Security**: Passwords never returned in responses, always hashed
4. **Information Disclosure**: Generic error messages (FR-012)
5. **Session Security**: Secure, HttpOnly cookies for session management

## Status Codes

- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or validation error
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but not authorized (future)
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting (Future)

- Sign in attempts: 5 per minute per IP
- Registration attempts: 3 per hour per IP
- Session requests: 100 per minute per user

## Versioning

Current version: `v1` (implicit, no versioning in URL initially)

Future breaking changes will require versioning strategy per constitution.

