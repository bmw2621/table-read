# Implementation Plan: Script Content Data Model

**Branch**: `003-scenes-characters-lines` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-scenes-characters-lines/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Extend the script data model to support structured script content by adding three new entities: scenes, characters, and lines. Scenes provide organizational structure for scripts, characters represent speakers, and lines contain dialogue text. This extends the existing script model (which currently only has a title) to enable full script content management while maintaining referential integrity and performance targets.

## Technical Context

**Language/Version**: TypeScript 5.6.3  
**Primary Dependencies**: Next.js 15.1.0, drizzle-orm 0.45.1, zod 3.23.8, next-auth 5.0.0-beta.30  
**Storage**: PostgreSQL via drizzle-orm with postgres driver  
**Testing**: Jest 30.2.0 with ts-jest, @testing-library/node for API route testing  
**Target Platform**: Node.js server (Next.js App Router)  
**Project Type**: web - Next.js single-page application with API routes  
**Performance Goals**: Scene creation <1s, character creation <1s, line creation <1s, query 100 scenes <500ms, query 50 characters <500ms, query 500 lines <1s  
**Constraints**: Maintain referential integrity (lines must reference valid characters/scenes in same script), support scripts with up to 200 scenes, 100 characters, and 1000 lines per scene  
**Scale/Scope**: Single application extending existing script data model, three new database tables with foreign key relationships

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Component-First (I)
✅ **PASS**: This feature extends existing data models (scenes, characters, lines) as database entities. Service layer functions in `src/lib/scenes/`, `src/lib/characters/`, `src/lib/lines/` will be self-contained and reusable.

### API/Route Interface (II)
✅ **PASS**: API routes will follow existing RESTful patterns:
- `GET /api/scripts/[id]/scenes` - List scenes for a script
- `POST /api/scripts/[id]/scenes` - Create scene
- `GET /api/scripts/[id]/characters` - List characters for a script
- `POST /api/scripts/[id]/characters` - Create character
- `POST /api/scenes/[id]/lines` - Create line
- `GET /api/scenes/[id]/lines` - List lines for a scene
Consistent request/response patterns with existing script API routes.

### Test-First (III) - NON-NEGOTIABLE
✅ **PASS**: All business logic in service layer will have unit tests. API routes will have integration tests. Test coverage for validation, access control, and cascade deletion behavior. Tests written BEFORE implementation per TDD.

### Integration Testing (IV)
✅ **PASS**: Contract tests for new API routes, integration tests for database operations (scenes, characters, lines CRUD), foreign key constraint validation, cascade deletion behavior.

### Observability & Simplicity (V)
✅ **PASS**: Structured logging for creation/update/delete operations. Error tracking for validation failures. Simple schema design - three tables with clear foreign key relationships. No premature optimization - indexes added only where performance targets require them.

**Constitution Gate**: ✅ PASS - No violations, all principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/003-scenes-characters-lines/
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
│   │   ├── scripts/
│   │   │   └── [id]/
│   │   │       ├── scenes/
│   │   │       │   └── route.ts
│   │   │       └── characters/
│   │   │           └── route.ts
│   │   └── scenes/
│   │       └── [id]/
│   │           └── lines/
│   │               └── route.ts
│   └── app/
│       └── script/
│           └── [scriptId]/
│               └── page.tsx
├── lib/
│   ├── db/
│   │   └── schema.ts (extend with scenes, characters, lines)
│   ├── scenes/
│   │   ├── service.ts
│   │   ├── validation.ts
│   │   └── access.ts
│   ├── characters/
│   │   ├── service.ts
│   │   ├── validation.ts
│   │   └── access.ts
│   └── lines/
│       ├── service.ts
│       ├── validation.ts
│       └── access.ts
└── typedefs/
    └── api.ts (extend with Scene, Character, Line types)

tests/
├── contract/
│   └── api/
│       ├── scenes.test.ts
│       ├── characters.test.ts
│       └── lines.test.ts
├── integration/
│   ├── scenes.test.ts
│   ├── characters.test.ts
│   └── lines.test.ts
└── unit/
    ├── scenes/
    │   ├── service.test.ts
    │   └── validation.test.ts
    ├── characters/
    │   ├── service.test.ts
    │   └── validation.test.ts
    └── lines/
        ├── service.test.ts
        └── validation.test.ts
```

**Structure Decision**: Extend existing single-project Next.js structure. New service modules (`scenes/`, `characters/`, `lines/`) follow same pattern as existing `scripts/` and `troupes/` modules. API routes follow RESTful patterns under `/api/scripts/[id]/scenes` and `/api/scenes/[id]/lines` for natural resource hierarchy.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - complexity is minimal. Three new database tables with standard foreign key relationships, following existing patterns.
