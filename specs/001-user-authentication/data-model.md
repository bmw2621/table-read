# Data Model: User Authentication

**Feature**: User Authentication  
**Date**: 2025-12-10  
**Database**: PostgreSQL  
**ORM**: drizzle-orm

## Entities

### User Account

Represents a registered user in the system.

**Table Name**: `users`

**Fields**:
- `id` (string, primary key) - Unique identifier for the user account
- `name` (string, nullable) - Display name (optional, username used for auth)
- `username` (string, unique, not null) - Unique username for authentication
- `password` (string, not null) - Securely hashed password (never plain text)
- `email` (string, nullable) - Email address (optional for future use)
- `emailVerified` (timestamp, nullable) - Email verification timestamp
- `image` (string, nullable) - Profile image URL
- `createdAt` (timestamp, default: now) - Account creation timestamp
- `updatedAt` (timestamp, default: now, on update: now) - Last update timestamp

**Validation Rules**:
- Username must be unique (enforced at database level)
- Username cannot be empty
- Password must meet security requirements (minimum length, complexity) - enforced in application layer
- Password is never stored in plain text (hashed by auth.js)

**Relationships**:
- One-to-many with `sessions` (one user can have multiple sessions)
- One-to-many with `accounts` (for future OAuth providers)

**State Transitions**:
- **Created**: User account created via registration
- **Active**: User can sign in and access protected features
- **Suspended**: (Future) Account temporarily disabled
- **Deleted**: (Future) Account marked for deletion

---

### Authentication Session

Represents an active authenticated state for a user.

**Table Name**: `sessions`

**Fields**:
- `id` (string, primary key) - Unique session identifier
- `userId` (string, foreign key → users.id, not null) - Associated user account
- `expiresAt` (timestamp, not null) - Session expiration timestamp
- `token` (string, unique, not null) - Session token
- `ipAddress` (string, nullable) - IP address where session was created
- `userAgent` (string, nullable) - User agent string
- `createdAt` (timestamp, default: now) - Session creation timestamp
- `updatedAt` (timestamp, default: now, on update: now) - Last activity timestamp

**Validation Rules**:
- `userId` must reference a valid user account
- `expiresAt` must be in the future when session is created
- `token` must be unique

**Relationships**:
- Many-to-one with `users` (many sessions belong to one user)

**State Transitions**:
- **Active**: Session is valid and user is authenticated
- **Expired**: Session expiration time has passed
- **Terminated**: User signed out or session was invalidated

**Note**: If using JWT sessions (default), sessions may be stored in JWT tokens rather than database. Database sessions provide better control and revocation capabilities.

---

### Account (Future OAuth Support)

Represents linked OAuth accounts (for future expansion).

**Table Name**: `accounts`

**Fields**:
- `id` (string, primary key) - Unique identifier
- `userId` (string, foreign key → users.id, not null) - Associated user account
- `type` (string, not null) - Account type (e.g., "oauth", "credentials")
- `provider` (string, not null) - OAuth provider name (e.g., "google", "github")
- `providerAccountId` (string, not null) - Provider-specific account ID
- `refreshToken` (string, nullable) - OAuth refresh token
- `accessToken` (string, nullable) - OAuth access token
- `expiresAt` (timestamp, nullable) - Token expiration
- `tokenType` (string, nullable) - Token type
- `scope` (string, nullable) - OAuth scopes
- `idToken` (string, nullable) - OIDC ID token
- `sessionState` (string, nullable) - OAuth session state
- `createdAt` (timestamp, default: now) - Account link creation timestamp
- `updatedAt` (timestamp, default: now, on update: now) - Last update timestamp

**Validation Rules**:
- `userId` must reference a valid user account
- `provider` and `providerAccountId` combination must be unique

**Relationships**:
- Many-to-one with `users` (one user can have multiple OAuth accounts)

**Note**: This table is part of auth.js standard schema but not required for initial username/password implementation. Included for future compatibility.

---

### Verification Token (Future Email Verification)

Represents email verification or password reset tokens (for future expansion).

**Table Name**: `verification_tokens`

**Fields**:
- `identifier` (string, not null) - Email or identifier being verified
- `token` (string, not null) - Verification token
- `expiresAt` (timestamp, not null) - Token expiration timestamp
- `createdAt` (timestamp, default: now) - Token creation timestamp

**Validation Rules**:
- `identifier` and `token` combination must be unique
- `expiresAt` must be in the future when token is created

**Note**: This table is part of auth.js standard schema but not required for initial username/password implementation. Included for future compatibility.

---

## Schema Relationships

```
users (1) ──< (many) sessions
users (1) ──< (many) accounts
```

## Indexes

**Performance Optimizations**:
- `users.username` - Unique index (enforced by unique constraint)
- `sessions.userId` - Index for fast user session lookups
- `sessions.token` - Unique index for session token lookups
- `sessions.expiresAt` - Index for expired session cleanup queries
- `accounts.userId` - Index for user account lookups
- `accounts.provider_providerAccountId` - Composite unique index

## Data Integrity

**Constraints**:
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate usernames and session tokens
- Not null constraints ensure required fields are always present

**Cascade Behavior**:
- On user deletion: Cascade delete sessions and accounts (or soft delete)
- On session expiration: Automatic cleanup via scheduled job (future)

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt/Argon2 (handled by auth.js)
2. **Session Security**: Session tokens are cryptographically secure random strings
3. **SQL Injection**: Prevented via parameterized queries (drizzle-orm handles this)
4. **Data Validation**: Application-layer validation before database operations
5. **Audit Trail**: `createdAt` and `updatedAt` timestamps for all entities

## Migration Strategy

1. Initial migration creates all tables with indexes
2. Future migrations for schema changes (email verification, password reset)
3. Use drizzle-kit for migration generation and management

