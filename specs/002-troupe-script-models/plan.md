# Implementation Plan: Troupe and Script Data Models

**Branch**: `002-troupe-script-models` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-troupe-script-models/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements data models for troupes (user groups) and scripts (content documents) with ownership relationships. Users can belong to multiple troupes, and scripts can be owned by either users or troupes. Troupe directors have exclusive permissions to manage memberships. The implementation will extend the existing PostgreSQL schema using drizzle-orm, following the established patterns from the user authentication feature.

**Phase 0 Complete**: Research.md generated with Jest testing framework decision and technical patterns resolved.

**Phase 1 Complete**: Data model, API contracts, and quickstart guide generated. Ready for implementation.

## Technical Context

**Language/Version**: TypeScript 5.6.3  
**Primary Dependencies**: Next.js 15.1.0, drizzle-orm 0.45.1, zod 3.23.8, next-auth 5.0.0-beta.30  
**Storage**: PostgreSQL (via drizzle-orm)  
**Testing**: Jest with @testing-library/react, @testing-library/node, ts-jest (resolved in research.md)  
**Target Platform**: Web (Next.js server-side and client-side)  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**: 
- Troupe creation: <5 seconds (SC-001)
- Script creation: <3 seconds (SC-002)
- Script access queries: <1 second for up to 1000 scripts (SC-007)
- Member management: <2 seconds (SC-008)
**Constraints**: 
- API response times: <200ms p95 (constitution requirement)
- Support users in 50+ troupes simultaneously (SC-005)
- Support troupes with 100+ members (SC-006)
- 100% accuracy for access control (SC-003, SC-004, SC-009)
**Scale/Scope**: 
- Many-to-many user-troupe relationships
- Polymorphic script ownership (user OR troupe)
- Director-based permission model

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Component-First
✅ **PASS**: Data models are standalone, reusable components (troupe, script, membership tables). Models are self-contained with clear interfaces via drizzle-orm schema definitions. Service layer organized by feature domain.

### II. API/Route Interface
✅ **PASS**: API routes defined in contracts/ (troupe-api.md, script-api.md, openapi.yaml). RESTful conventions with consistent request/response patterns. All endpoints documented with request/response schemas.

### III. Test-First (NON-NEGOTIABLE)
⚠️ **CONFIGURATION REQUIRED**: Jest selected as testing framework (research.md). Configuration documented in quickstart.md. Must configure Jest before implementation begins. TDD mandatory - tests written before code.

### IV. Integration Testing
✅ **PASS**: Integration test requirements identified:
- Database interactions (troupe/script CRUD) - documented in quickstart.md
- Permission enforcement (director-only actions) - service layer with permission checks
- Access control (troupe membership-based script access) - access control logic in scripts/service.ts
- API route contract tests - contract tests documented in project structure

### V. Observability & Simplicity
✅ **PASS**: Structured logging required for all operations. Start simple - basic data models with clear relationships. Complexity justified by requirements (many-to-many, polymorphic ownership). Service layer provides clear separation of concerns.

### Testing Gates
⚠️ **CONFIGURATION REQUIRED**: Jest framework selected and configuration documented. Unit tests required for business logic (permission checks, access control). Integration tests required for API routes and database operations. Test structure defined in project structure.

### Code Quality
✅ **PASS**: TypeScript with strict typing. Zod for runtime validation. Drizzle-orm provides type-safe database operations. Validation schemas defined for all API inputs.

### Performance Standards
✅ **PASS**: Performance goals align with constitution (<200ms p95 API responses). Database queries optimized with proper indexing (indexes defined in data-model.md). Query patterns documented for access control.

### Security Requirements
✅ **PASS**: Authentication required (existing next-auth). Input validation via Zod schemas. SQL injection prevention via drizzle-orm parameterized queries. Permission checks for director-only actions. Access control enforced at service layer.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── troupes/          # Troupe CRUD endpoints
│   │   │   ├── route.ts      # GET (list), POST (create)
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts  # GET, DELETE
│   │   │   │   ├── members/
│   │   │   │   │   └── route.ts  # POST (approve), DELETE (remove)
│   │   └── scripts/          # Script CRUD endpoints
│   │       ├── route.ts      # GET (list accessible), POST (create)
│   │       └── [id]/
│   │           └── route.ts  # GET, PUT, DELETE
│   └── (pages)/              # Future UI pages
├── lib/
│   ├── db/
│   │   ├── schema.ts         # Extended with troupes, scripts, memberships
│   │   └── index.ts          # Database connection
│   ├── troupes/
│   │   ├── service.ts        # Business logic for troupe operations
│   │   ├── validation.ts    # Zod schemas for troupe validation
│   │   └── permissions.ts   # Director permission checks
│   └── scripts/
│       ├── service.ts        # Business logic for script operations
│       ├── validation.ts    # Zod schemas for script validation
│       └── access.ts        # Access control logic (ownership + membership)

tests/
├── contract/
│   └── api/                  # API contract tests
│       ├── troupes.test.ts
│       └── scripts.test.ts
├── integration/
│   ├── troupes.test.ts       # Troupe CRUD + permissions
│   ├── scripts.test.ts      # Script CRUD + access control
│   └── membership.test.ts   # User-troupe membership flows
└── unit/
    ├── troupes/
    │   ├── service.test.ts
    │   └── permissions.test.ts
    └── scripts/
        ├── service.test.ts
        └── access.test.ts
```

**Structure Decision**: Next.js web application structure. Data models extend existing `src/lib/db/schema.ts`. Business logic organized in feature-specific service modules (`src/lib/troupes/`, `src/lib/scripts/`). API routes follow Next.js App Router conventions in `src/app/api/`. Tests organized by type (contract, integration, unit) matching constitution requirements.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
