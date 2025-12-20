# Data Model: Troupe and Script Data Models

**Feature**: Troupe and Script Data Models  
**Date**: 2025-12-12  
**Database**: PostgreSQL  
**ORM**: drizzle-orm

## Entities

### Troupe

Represents a group that users can belong to. The user who creates a troupe becomes the "director" with exclusive management permissions.

**Table Name**: `troupes`

**Fields**:
- `id` (string, primary key) - Unique identifier for the troupe (CUID2)
- `directorId` (string, foreign key → users.id, not null) - User who created the troupe and has management permissions
- `createdAt` (timestamp, default: now) - Troupe creation timestamp
- `updatedAt` (timestamp, default: now, on update: now) - Last update timestamp

**Validation Rules**:
- `directorId` must reference a valid user account
- Director is automatically added as a member when troupe is created
- Director cannot be removed from troupe (must delete troupe or transfer directorship)

**Relationships**:
- Many-to-one with `users` (director relationship)
- Many-to-many with `users` via `troupeMemberships` (membership relationship)

**State Transitions**:
- **Created**: Troupe created with creator as director and first member
- **Active**: Troupe has members and can own scripts
- **Deleted**: Troupe and all memberships removed (cascade behavior for scripts TBD)

**Indexes**:
- `directorId` - Index for fast director lookups
- Primary key index on `id`

---

### Troupe Membership

Represents the many-to-many relationship between users and troupes. Enables users to belong to multiple troupes and troupes to have multiple members.

**Table Name**: `troupeMemberships`

**Fields**:
- `id` (string, primary key) - Unique identifier for the membership (CUID2)
- `userId` (string, foreign key → users.id, not null) - User who is a member
- `troupeId` (string, foreign key → troupes.id, not null) - Troupe the user belongs to
- `createdAt` (timestamp, default: now) - Membership creation timestamp
- `updatedAt` (timestamp, default: now, on update: now) - Last update timestamp

**Validation Rules**:
- `userId` must reference a valid user account
- `troupeId` must reference a valid troupe
- Unique constraint on `(userId, troupeId)` to prevent duplicate memberships
- Only director can create memberships (application-level enforcement)
- Director cannot remove themselves (application-level enforcement)

**Relationships**:
- Many-to-one with `users` (many memberships belong to one user)
- Many-to-one with `troupes` (many memberships belong to one troupe)

**State Transitions**:
- **Pending**: (Future) Membership request pending director approval
- **Active**: User is an active member of the troupe
- **Removed**: Membership deleted by director

**Indexes**:
- `userId` - Index for fast user troupe queries
- `troupeId` - Index for fast troupe member queries
- Unique composite index on `(userId, troupeId)` - Prevents duplicate memberships

**Cascade Behavior**:
- On troupe deletion: Cascade delete all memberships
- On user deletion: TBD (users assumed to exist, deletion not in scope)

---

### Script

Represents a script document with a title. Can be owned by either a single user (personal script) or a single troupe (shared script). Ownership is mutually exclusive.

**Table Name**: `scripts`

**Fields**:
- `id` (string, primary key) - Unique identifier for the script (CUID2)
- `title` (string, not null) - Script title (required)
- `userId` (string, foreign key → users.id, nullable) - User owner (mutually exclusive with troupeId)
- `troupeId` (string, foreign key → troupes.id, nullable) - Troupe owner (mutually exclusive with userId)
- `createdAt` (timestamp, default: now) - Script creation timestamp
- `updatedAt` (timestamp, default: now, on update: now) - Last update timestamp

**Validation Rules**:
- `title` is required and cannot be empty
- Exactly one of `userId` or `troupeId` must be non-null (application-level check)
- `userId` must reference a valid user account if provided
- `troupeId` must reference a valid troupe if provided
- Users can only create scripts for troupes they belong to (application-level check)

**Relationships**:
- Many-to-one with `users` (many scripts can belong to one user)
- Many-to-one with `troupes` (many scripts can belong to one troupe)

**State Transitions**:
- **Created**: Script created with title and owner
- **Active**: Script exists and is accessible to owner(s)
- **Deleted**: Script removed from system

**Access Control**:
- User-owned scripts: Accessible only to the owning user
- Troupe-owned scripts: Accessible to all members of the troupe
- Access determined by: direct ownership OR troupe membership

**Indexes**:
- `userId` - Index for fast user script queries
- `troupeId` - Index for fast troupe script queries
- Composite index on `(userId, troupeId)` may be beneficial for access queries (evaluate based on query patterns)

**Cascade Behavior**:
- On user deletion: TBD (users assumed to exist, deletion not in scope)
- On troupe deletion: TBD (delete scripts or transfer ownership - decision needed)

---

## Schema Relationships

```
users (1) ──< (many) troupes (director relationship)
users (1) ──< (many) troupeMemberships ──> (many) troupes (membership relationship)
users (1) ──< (many) scripts (user ownership)
troupes (1) ──< (many) scripts (troupe ownership)
```

## Data Integrity Constraints

### Foreign Key Constraints
- `troupes.directorId` → `users.id` (on delete: restrict - prevent director deletion if troupe exists)
- `troupeMemberships.userId` → `users.id` (on delete: TBD)
- `troupeMemberships.troupeId` → `troupes.id` (on delete: cascade - delete memberships when troupe deleted)
- `scripts.userId` → `users.id` (on delete: TBD)
- `scripts.troupeId` → `troupes.id` (on delete: TBD - cascade delete or restrict)

### Unique Constraints
- `troupeMemberships(userId, troupeId)` - Prevents duplicate memberships

### Check Constraints (Application-Level)
- `scripts`: Exactly one of `userId` or `troupeId` must be non-null
- `troupeMemberships`: Director cannot remove themselves (application logic)
- `scripts`: User can only create scripts for troupes they belong to (application logic)

## Indexes Summary

**Performance Optimizations**:
- `troupes.directorId` - Fast director lookups
- `troupeMemberships.userId` - Fast user troupe queries (supports SC-005: 50+ troupes per user)
- `troupeMemberships.troupeId` - Fast troupe member queries (supports SC-006: 100+ members per troupe)
- `troupeMemberships(userId, troupeId)` - Unique constraint + fast membership checks
- `scripts.userId` - Fast user script queries
- `scripts.troupeId` - Fast troupe script queries

**Query Optimization Notes**:
- Access queries (user's accessible scripts) will join `scripts` with `troupeMemberships` on `troupeId`
- Consider composite indexes if query patterns show performance issues
- Monitor query performance for SC-007: <1 second for up to 1000 scripts

## Security Considerations

1. **Permission Enforcement**: Director-only operations enforced at application layer
2. **Access Control**: Script access determined by ownership + membership checks
3. **Input Validation**: All inputs validated via Zod schemas
4. **SQL Injection**: Prevented via drizzle-orm parameterized queries
5. **Data Validation**: Application-layer validation before database operations
6. **Audit Trail**: `createdAt` and `updatedAt` timestamps for all entities

## Migration Strategy

1. Create `troupes` table with director relationship
2. Create `troupeMemberships` junction table with unique constraint
3. Create `scripts` table with polymorphic ownership columns
4. Add indexes for performance
5. Use drizzle-kit for migration generation and management
6. Test migrations on development database before production

## Edge Cases Handled

1. **Duplicate Memberships**: Prevented by unique constraint on `(userId, troupeId)`
2. **Director Self-Removal**: Prevented by application logic
3. **Script with No Owner**: Prevented by application validation (exactly one owner required)
4. **Script for Non-Member Troupe**: Prevented by application validation
5. **Empty Title**: Prevented by not null constraint and validation

## Future Considerations

- Troupe attributes beyond identifier and director (name, description, etc.)
- Script attributes beyond title (content, metadata, etc.)
- Directorship transfer functionality
- Membership request/approval workflow
- Script ownership transfer
- Soft deletes for audit trail
- Cascade deletion policies for production

