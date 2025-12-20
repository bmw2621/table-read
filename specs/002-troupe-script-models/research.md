# Research: Troupe and Script Data Models

**Date**: 2025-12-12  
**Feature**: Troupe and Script Data Models with Ownership Relationships  
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Technology Choices

### Testing Framework: Jest

**Decision**: Use Jest for unit, integration, and contract testing

**Rationale**: 
- User specified Jest as the testing framework
- Jest is well-established and widely used in the Node.js/Next.js ecosystem
- Excellent TypeScript support
- Good integration with Next.js testing utilities
- Supports both unit and integration testing patterns
- Active community and extensive documentation

**Alternatives considered**: 
- Vitest: Faster but less mature ecosystem, user preference is Jest
- Mocha/Chai: More flexible but requires more configuration

**Package Versions** (to be added):
- `jest@latest` - Core testing framework
- `@testing-library/react@latest` - React component testing utilities
- `@testing-library/jest-dom@latest` - DOM matchers for Jest
- `@testing-library/node` - Node.js testing utilities for API routes
- `jest-environment-node` - Node environment for API route tests
- `ts-jest` or `@jest/transform` - TypeScript support for Jest

**Implementation Notes**:
- Configure Jest in `jest.config.js` or `jest.config.ts`
- Use `@testing-library/node` for testing Next.js API routes
- Unit tests for business logic in `tests/unit/`
- Integration tests for API routes and database operations in `tests/integration/`
- Contract tests for API stability in `tests/contract/`

---

### Database Schema: Extending Existing Schema

**Decision**: Extend existing drizzle-orm schema in `src/lib/db/schema.ts`

**Rationale**:
- Consistent with existing user authentication schema
- Reuses established patterns and connection setup
- Maintains single source of truth for database schema
- Leverages existing drizzle-kit migration workflow

**Implementation**:
- Add `troupes` table with director relationship
- Add `troupeMemberships` junction table for many-to-many user-troupe relationship
- Add `scripts` table with polymorphic ownership (user OR troupe)
- Use drizzle-orm foreign keys and constraints
- Generate migrations via `drizzle-kit generate`

---

### Polymorphic Ownership Pattern

**Decision**: Use nullable foreign keys for script ownership (userId OR troupeId, mutually exclusive)

**Rationale**:
- Simple and performant - no additional join tables needed
- Clear ownership semantics
- Easy to query and validate
- Standard pattern for single-table polymorphism in relational databases

**Alternatives considered**:
- Separate tables (userScripts, troupeScripts): More normalized but requires UNION queries
- Junction table with type discriminator: More complex, adds unnecessary joins
- Single ownerId with ownerType enum: Less type-safe, harder to enforce referential integrity

**Implementation**:
- `scripts` table has both `userId` and `troupeId` columns (both nullable)
- Application-level constraint: exactly one must be non-null
- Database check constraint or application validation enforces mutual exclusivity
- Indexes on both foreign keys for query performance

---

### Permission Model: Director-Based Access Control

**Decision**: Implement director permissions at application layer with service-level checks

**Rationale**:
- Matches requirement: only director can approve/remove members and delete troupe
- Simple to implement and test
- Clear separation of concerns
- Can be extended later with role-based access control if needed

**Alternatives considered**:
- Database-level row-level security: More complex, harder to test, overkill for current requirements
- Middleware-based permissions: Less flexible, harder to reuse across different endpoints

**Implementation**:
- Permission checks in `src/lib/troupes/permissions.ts`
- Service layer validates director status before allowing operations
- Reusable permission check functions
- Clear error messages when permissions are denied

---

### Access Control: Troupe Membership-Based Script Access

**Decision**: Query-based access control - check membership when retrieving scripts

**Rationale**:
- Efficient: single query can join memberships and filter scripts
- Clear and testable logic
- Matches requirement: users access scripts through troupe membership
- Can be optimized with proper indexes

**Implementation**:
- Access control logic in `src/lib/scripts/access.ts`
- Query joins scripts with troupe memberships for current user
- Returns union of: user-owned scripts + troupe-owned scripts (where user is member)
- Cached membership checks for performance (future optimization)

---

## Best Practices & Patterns

### Database Indexing Strategy

**Decision**: Index foreign keys and frequently queried columns

**Rationale**:
- Performance requirements: <1 second for 1000 scripts (SC-007)
- Support 50+ troupes per user (SC-005)
- Support 100+ members per troupe (SC-006)

**Indexes Required**:
- `troupes.directorId` - Fast director lookups
- `troupeMemberships.userId` - Fast user troupe queries
- `troupeMemberships.troupeId` - Fast troupe member queries
- `troupeMemberships(userId, troupeId)` - Unique constraint for preventing duplicates
- `scripts.userId` - Fast user script queries
- `scripts.troupeId` - Fast troupe script queries
- `scripts(userId, troupeId)` - Composite index for access queries (if needed)

---

### Validation: Zod Schemas

**Decision**: Use Zod for runtime validation of API inputs

**Rationale**:
- Already in dependencies (zod 3.23.8)
- Type-safe validation with TypeScript inference
- Consistent with existing codebase patterns
- Excellent error messages

**Implementation**:
- Validation schemas in `src/lib/troupes/validation.ts`
- Validation schemas in `src/lib/scripts/validation.ts`
- Validate at API route boundaries
- Return clear validation errors

---

### Error Handling Pattern

**Decision**: Structured error responses with appropriate HTTP status codes

**Rationale**:
- RESTful API conventions
- Clear error messages for debugging
- Security: don't leak sensitive information
- Consistent with Next.js API route patterns

**Error Types**:
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied (e.g., non-director trying to manage troupe)
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Duplicate membership, etc.
- `500 Internal Server Error` - Unexpected errors (log details, return generic message)

---

### Cascade Deletion Strategy

**Decision**: Handle deletions based on edge case requirements

**Rationale**:
- Edge cases in spec require decisions on cascade behavior
- Need to prevent orphaned data
- Balance data integrity with user experience

**Decisions**:
- **User deletion**: NEEDS CLARIFICATION - Spec assumes users exist, deletion not in scope
- **Troupe deletion**: Cascade delete memberships, handle scripts (delete or transfer - NEEDS CLARIFICATION)
- **Director deletion**: NEEDS CLARIFICATION - Spec mentions transfer or cascade delete troupe
- **Script deletion**: Standard delete (no cascades needed)

**Implementation Notes**:
- Use drizzle-orm `onDelete: "cascade"` for memberships when troupe is deleted
- Script deletion strategy to be determined (likely cascade delete troupe scripts, keep user scripts)
- Director removal prevention: application-level check prevents director from removing themselves

---

## Integration Points

### Next.js API Routes

**Pattern**: RESTful API routes in `src/app/api/` following Next.js App Router conventions

**Implementation**:
- `GET /api/troupes` - List user's troupes
- `POST /api/troupes` - Create troupe (user becomes director)
- `GET /api/troupes/[id]` - Get troupe details
- `DELETE /api/troupes/[id]` - Delete troupe (director only)
- `POST /api/troupes/[id]/members` - Approve member (director only)
- `DELETE /api/troupes/[id]/members/[userId]` - Remove member (director only)
- `GET /api/scripts` - List accessible scripts (user-owned + troupe-owned)
- `POST /api/scripts` - Create script (user or troupe ownership)
- `GET /api/scripts/[id]` - Get script details (with access check)
- `PUT /api/scripts/[id]` - Update script (owner only)
- `DELETE /api/scripts/[id]` - Delete script (owner only)

---

### Authentication Integration

**Pattern**: Use existing next-auth session for user identification

**Implementation**:
- All API routes require authentication (middleware or route-level check)
- Extract userId from session: `const session = await auth()`
- Use session.userId for ownership and membership checks
- Reuse existing authentication middleware

---

### Database Migration Strategy

**Decision**: Use drizzle-kit for schema migrations

**Rationale**:
- Already configured in project
- Type-safe migrations
- Version-controlled migration files
- Easy rollback support

**Implementation**:
- Run `yarn db:gen` to generate migration after schema changes
- Review generated migration SQL
- Run `yarn db:migrate` to apply migrations
- Test migrations on development database first

---

## Remaining Clarifications

1. **Cascade Deletion Behavior**: 
   - What happens to troupe-owned scripts when troupe is deleted? (Delete or transfer to user)
   - What happens to troupe when director is deleted? (Transfer directorship or delete troupe)

2. **Script Ownership Transfer**: 
   - Can scripts change ownership after creation? (Spec says "may be changeable in the future" - out of scope for now)

---

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Next.js 15 API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Jest Documentation](https://jestjs.io)
- [Zod Documentation](https://zod.dev)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)

