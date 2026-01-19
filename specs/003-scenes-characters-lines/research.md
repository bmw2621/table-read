# Research: Script Content Data Model

**Date**: 2025-12-12  
**Feature**: Script Content Data Model - Scenes, Characters, and Lines  
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Technology Choices

### Database Schema: Extending Existing Schema Pattern

**Decision**: Extend existing drizzle-orm schema in `src/lib/db/schema.ts` following the pattern established in feature 002 (troupes, scripts)

**Rationale**:

- Consistent with existing schema structure and naming conventions
- Reuses established patterns for foreign keys, indexes, and cascade behavior
- Maintains single source of truth for database schema
- Leverages existing drizzle-kit migration workflow

**Implementation**:

- Add `scenes` table with `scriptId` foreign key (cascade delete on script deletion)
- Add `characters` table with `scriptId` foreign key (cascade delete on script deletion)
- Add `lines` table with `characterId` and `sceneId` foreign keys (cascade delete on character/scene deletion)
- Use drizzle-orm foreign keys and constraints
- Generate migrations via `drizzle-kit generate`

---

### Referential Integrity Pattern: Foreign Key Constraints with Cascade Deletes

**Decision**: Use foreign key constraints with cascade delete behavior for parent-child relationships

**Rationale**:

- Ensures data integrity - prevents orphaned records
- Matches requirements (FR-014 through FR-017): cascade delete scenes/characters when script deleted, cascade delete lines when scene deleted, set characterId to null when character deleted
- Standard pattern for relational databases
- Simplifies application logic - no manual cleanup required

**Implementation**:

- `scenes.scriptId` → `scripts.id` (onDelete: "cascade")
- `characters.scriptId` → `scripts.id` (onDelete: "cascade")
- `lines.sceneId` → `scenes.id` (onDelete: "cascade")
- `lines.characterId` → `characters.id` (onDelete: "cascade")
- Application-level validation ensures character and scene belong to same script (FR-012, FR-013)

**Alternatives considered**:

- Soft deletes: More complex, adds state management overhead, not required for current feature
- Manual cleanup: Error-prone, requires transaction handling, violates DRY principle

---

### Validation: Cross-Entity Validation Pattern

**Decision**: Implement application-level validation to ensure lines reference characters and scenes from the same script

**Rationale**:

- Foreign keys alone cannot enforce the constraint that a line's character and scene must belong to the same script
- Prevents data inconsistency that would violate FR-012 and FR-013
- Clear validation errors for users
- Matches pattern used in feature 002 for script ownership validation

**Implementation**:

- Validation in service layer before creating lines
- Query character and scene to verify they belong to the same scriptId
- Return clear error message if validation fails
- Use Zod schemas for input validation, service-level checks for business rules

---

### Database Indexing Strategy

**Decision**: Index foreign keys and frequently queried columns to meet performance targets

**Rationale**:

- Performance requirements: query 100 scenes <500ms (SC-004), query 50 characters <500ms (SC-005), query 500 lines <1s (SC-006)
- Support scripts with up to 200 scenes, 100 characters, 1000 lines per scene (SC-010, SC-011, SC-012)

**Indexes Required**:

- `scenes.scriptId` - Fast scene queries for a script (supports SC-004, SC-010)
- `characters.scriptId` - Fast character queries for a script (supports SC-005, SC-011)
- `lines.sceneId` - Fast line queries for a scene (supports SC-006, SC-012)
- `lines.characterId` - Fast line queries for a character (supports FR-021)
- Consider composite index on `(sceneId, characterId)` if query patterns require filtering by both

---

### Service Layer Organization Pattern

**Decision**: Create separate service modules for each entity (`scenes/`, `characters/`, `lines/`) following pattern from `scripts/` and `troupes/`

**Rationale**:

- Maintains consistency with existing codebase structure
- Follows component-first principle (Constitution I) - each module is self-contained
- Clear separation of concerns
- Easy to test independently
- Reusable service functions

**Implementation**:

- `src/lib/scenes/service.ts` - Scene CRUD operations
- `src/lib/scenes/validation.ts` - Zod schemas for scene validation
- `src/lib/scenes/access.ts` - Access control (inherits from script access)
- Same structure for `characters/` and `lines/`

**Access Control Note**: Scene/character/line access inherits from script access - if user can access script, they can access its scenes/characters/lines (FR-018, FR-019, FR-020)

---

### API Route Structure Pattern

**Decision**: Follow RESTful resource hierarchy: `/api/scripts/[id]/scenes`, `/api/scenes/[id]/lines`

**Rationale**:

- Matches natural resource hierarchy (scenes belong to scripts, lines belong to scenes)
- Consistent with existing `/api/scripts/[id]` pattern
- Clear and intuitive API design
- Easy to understand and test

**Implementation**:

- `GET /api/scripts/[id]/scenes` - List scenes for a script
- `POST /api/scripts/[id]/scenes` - Create scene in script
- `GET /api/scripts/[id]/characters` - List characters for a script
- `POST /api/scripts/[id]/characters` - Create character in script
- `GET /api/scenes/[id]/lines` - List lines for a scene
- `POST /api/scenes/[id]/lines` - Create line in scene

**Alternative considered**: Flat structure (`/api/scenes?scriptId=x`) - less intuitive, requires query parameters, harder to validate resource ownership

---

## Best Practices & Patterns

### Validation: Zod Schemas

**Decision**: Use Zod for runtime validation of API inputs, following pattern from feature 002

**Rationale**:

- Already in dependencies (zod 3.23.8)
- Type-safe validation with TypeScript inference
- Consistent with existing codebase patterns
- Excellent error messages

**Implementation**:

- Validation schemas in `src/lib/scenes/validation.ts`
- Validation schemas in `src/lib/characters/validation.ts`
- Validation schemas in `src/lib/lines/validation.ts`
- Validate at API route boundaries
- Return clear validation errors

---

### Error Handling Pattern

**Decision**: Structured error responses with appropriate HTTP status codes, following existing API route patterns

**Rationale**:

- RESTful API conventions
- Clear error messages for debugging
- Security: don't leak sensitive information
- Consistent with Next.js API route patterns

**Error Types**:

- `400 Bad Request` - Validation errors (invalid character/scene reference, missing required fields)
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied (cannot access script)
- `404 Not Found` - Resource doesn't exist (script, scene, character not found)
- `409 Conflict` - Referential integrity violation (character/scene don't belong to same script)
- `500 Internal Server Error` - Unexpected errors (log details, return generic message)

---

### Testing Strategy

**Decision**: Follow existing test structure from feature 002 - unit tests for service layer, integration tests for API routes

**Rationale**:

- Consistent with constitution requirements (Test-First, NON-NEGOTIABLE)
- Matches existing test patterns
- Clear separation: unit tests for business logic, integration tests for API/database interactions

**Test Structure**:

- Unit tests: `tests/unit/scenes/`, `tests/unit/characters/`, `tests/unit/lines/` for service and validation logic
- Integration tests: `tests/integration/scenes.test.ts`, `tests/integration/characters.test.ts`, `tests/integration/lines.test.ts` for database operations and API routes
- Contract tests: `tests/contract/api/scenes.test.ts`, etc. for API contract validation

---

## Integration Points

### Existing Script Service Integration

**Pattern**: Extend existing script access control - scenes/characters/lines inherit script access permissions

**Implementation**:

- Reuse `src/lib/scripts/access.ts` `canAccessScript()` function
- Before creating/querying scenes/characters/lines, verify user has access to parent script
- If user can access script, they can access all its scenes/characters/lines

---

### Database Migration Strategy

**Decision**: Use drizzle-kit for schema migrations, following existing workflow

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

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Next.js 15 API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Documentation](https://zod.dev)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)
- Feature 002: Troupe and Script Data Models (existing patterns)
