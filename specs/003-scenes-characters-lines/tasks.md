# Tasks: Script Content Data Model

**Input**: Design documents from `/specs/003-scenes-characters-lines/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED per constitution (Test-First, NON-NEGOTIABLE). All tests must be written BEFORE implementation (TDD).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure verification and preparation

- [ ] T001 Verify existing project structure matches plan.md (src/lib/, src/app/api/, tests/ directories exist)
- [ ] T002 [P] Create src/lib/scenes/ directory structure
- [ ] T003 [P] Create src/lib/characters/ directory structure
- [ ] T004 [P] Create src/lib/lines/ directory structure
- [ ] T005 [P] Create tests/unit/scenes/ directory structure
- [ ] T006 [P] Create tests/unit/characters/ directory structure
- [ ] T007 [P] Create tests/unit/lines/ directory structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Extend database schema in src/lib/db/schema.ts with scenes table (id, scriptId foreign key with cascade delete, createdAt, updatedAt) with scriptId index
- [ ] T009 [P] Extend database schema in src/lib/db/schema.ts with characters table (id, scriptId foreign key with cascade delete, createdAt, updatedAt) with scriptId index
- [ ] T010 [P] Extend database schema in src/lib/db/schema.ts with lines table (id, text, characterId nullable foreign key with set null on delete, sceneId foreign key with cascade delete, createdAt, updatedAt) with sceneId and characterId indexes
- [ ] T011 Generate database migration using yarn db:gen command
- [ ] T012 Review generated migration SQL in drizzle/ directory (verify cascade deletes, set null behavior, indexes)
- [ ] T013 Apply database migration using yarn db:push or yarn db:migrate

**Checkpoint**: Foundation ready - database schema extended with scenes, characters, and lines tables. Migration applied. User story implementation can now begin.

---

## Phase 3: User Story 1 - Organize Script Content with Scenes (Priority: P1) 🎯 MVP

**Goal**: Users can organize their script content into scenes. Each script can contain multiple scenes, allowing users to structure their script content logically.

**Independent Test**: Can be fully tested by creating a script, adding multiple scenes to it, and verifying that scenes are correctly associated with the script and can be retrieved.

### Tests for User Story 1 (TDD - Write FIRST, ensure they FAIL)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T014 [P] [US1] Create unit test for scene service in tests/unit/scenes/service.test.ts (createScene, getScenesByScript functions)
- [ ] T015 [P] [US1] Create unit test for scene validation in tests/unit/scenes/validation.test.ts (createSceneSchema validation)
- [ ] T016 [P] [US1] Create unit test for scene access control in tests/unit/scenes/access.test.ts (canAccessScene function)
- [ ] T017 [P] [US1] Create integration test for scene CRUD operations in tests/integration/scenes.test.ts (create scene, list scenes for script, access control)
- [ ] T018 [P] [US1] Create contract test for GET /api/scripts/[id]/scenes in tests/contract/api/scenes.test.ts
- [ ] T019 [P] [US1] Create contract test for POST /api/scripts/[id]/scenes in tests/contract/api/scenes.test.ts

### Implementation for User Story 1

- [ ] T020 [P] [US1] Create scene validation schema in src/lib/scenes/validation.ts (createSceneSchema with Zod)
- [ ] T021 [P] [US1] Create scene access control utility in src/lib/scenes/access.ts (canAccessScene function that uses canAccessScript)
- [ ] T022 [US1] Create scene service in src/lib/scenes/service.ts (createScene, getScenesByScript functions with access control)
- [ ] T023 [US1] Create GET /api/scripts/[id]/scenes route in src/app/api/scripts/[id]/scenes/route.ts (list scenes for script with access control)
- [ ] T024 [US1] Create POST /api/scripts/[id]/scenes route in src/app/api/scripts/[id]/scenes/route.ts (create scene with access control)
- [ ] T025 [US1] Add error handling and logging for scene operations in service and API routes
- [ ] T026 [US1] Add authentication checks to all scene API routes (use existing auth() from @/lib/auth)
- [ ] T027 [US1] Extend Scene type in src/typedefs/api.ts (export Scene type from schema)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can create scenes for scripts they have access to, list scenes for a script, and all access control is enforced.

---

## Phase 4: User Story 2 - Define Characters in Scripts (Priority: P1) 🎯 MVP

**Goal**: Users can define characters that exist within a script. Each script can have multiple characters, representing the actors or personas in the script.

**Independent Test**: Can be fully tested by creating a script, adding multiple characters to it, and verifying that characters are correctly associated with the script and can be retrieved.

### Tests for User Story 2 (TDD - Write FIRST, ensure they FAIL)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T028 [P] [US2] Create unit test for character service in tests/unit/characters/service.test.ts (createCharacter, getCharactersByScript functions)
- [ ] T029 [P] [US2] Create unit test for character validation in tests/unit/characters/validation.test.ts (createCharacterSchema validation)
- [ ] T030 [P] [US2] Create unit test for character access control in tests/unit/characters/access.test.ts (canAccessCharacter function)
- [ ] T031 [P] [US2] Create integration test for character CRUD operations in tests/integration/characters.test.ts (create character, list characters for script, access control)
- [ ] T032 [P] [US2] Create contract test for GET /api/scripts/[id]/characters in tests/contract/api/characters.test.ts
- [ ] T033 [P] [US2] Create contract test for POST /api/scripts/[id]/characters in tests/contract/api/characters.test.ts

### Implementation for User Story 2

- [ ] T034 [P] [US2] Create character validation schema in src/lib/characters/validation.ts (createCharacterSchema with Zod)
- [ ] T035 [P] [US2] Create character access control utility in src/lib/characters/access.ts (canAccessCharacter function that uses canAccessScript)
- [ ] T036 [US2] Create character service in src/lib/characters/service.ts (createCharacter, getCharactersByScript functions with access control)
- [ ] T037 [US2] Create GET /api/scripts/[id]/characters route in src/app/api/scripts/[id]/characters/route.ts (list characters for script with access control)
- [ ] T038 [US2] Create POST /api/scripts/[id]/characters route in src/app/api/scripts/[id]/characters/route.ts (create character with access control)
- [ ] T039 [US2] Add error handling and logging for character operations in service and API routes
- [ ] T040 [US2] Add authentication checks to all character API routes (use existing auth() from @/lib/auth)
- [ ] T041 [US2] Extend Character type in src/typedefs/api.ts (export Character type from schema)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can create scenes and characters for scripts they have access to, and all access control is enforced.

---

## Phase 5: User Story 3 - Add Dialogue Lines to Scenes (Priority: P2)

**Goal**: Users can add dialogue lines to scenes. Each line contains text content and belongs to a scene. Lines may optionally be associated with a character.

**Independent Test**: Can be fully tested by creating a script with scenes and characters, adding lines to a scene with optional character associations, and verifying that lines are correctly stored with their text, character, and scene relationships.

### Tests for User Story 3 (TDD - Write FIRST, ensure they FAIL)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T042 [P] [US3] Create unit test for line service in tests/unit/lines/service.test.ts (createLine, getLinesByScene functions with optional characterId)
- [ ] T043 [P] [US3] Create unit test for line validation in tests/unit/lines/validation.test.ts (createLineSchema validation with optional characterId)
- [ ] T044 [P] [US3] Create unit test for line access control in tests/unit/lines/access.test.ts (canAccessLine function)
- [ ] T045 [P] [US3] Create integration test for line CRUD operations in tests/integration/lines.test.ts (create line with character, create line without character, list lines for scene, character/scene same script validation)
- [ ] T046 [P] [US3] Create integration test for character deletion behavior in tests/integration/lines.test.ts (verify characterId set to null when character deleted)
- [ ] T047 [P] [US3] Create contract test for GET /api/scenes/[id]/lines in tests/contract/api/lines.test.ts
- [ ] T048 [P] [US3] Create contract test for POST /api/scenes/[id]/lines in tests/contract/api/lines.test.ts

### Implementation for User Story 3

- [ ] T049 [P] [US3] Create line validation schema in src/lib/lines/validation.ts (createLineSchema with Zod, characterId optional)
- [ ] T050 [P] [US3] Create line access control utility in src/lib/lines/access.ts (canAccessLine function that uses canAccessScene)
- [ ] T051 [US3] Create line service in src/lib/lines/service.ts (createLine with optional characterId, getLinesByScene functions with character/scene same script validation)
- [ ] T052 [US3] Create GET /api/scenes/[id]/lines route in src/app/api/scenes/[id]/lines/route.ts (list lines for scene with access control)
- [ ] T053 [US3] Create POST /api/scenes/[id]/lines route in src/app/api/scenes/[id]/lines/route.ts (create line with optional characterId, character/scene same script validation)
- [ ] T054 [US3] Add error handling and logging for line operations in service and API routes
- [ ] T055 [US3] Add authentication checks to all line API routes (use existing auth() from @/lib/auth)
- [ ] T056 [US3] Extend Line type in src/typedefs/api.ts (export Line type from schema with nullable characterId)

**Checkpoint**: At this point, all user stories should be independently functional. Users can create scenes, characters, and lines for scripts they have access to. Lines can exist without character associations, and when characters are deleted, lines have their characterId set to null.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T057 [P] Verify cascade deletion behavior: script deletion removes all scenes, characters, and lines
- [ ] T058 [P] Verify cascade deletion behavior: scene deletion removes all lines
- [ ] T059 [P] Verify set null behavior: character deletion sets characterId to null for all lines
- [ ] T060 [P] Run performance tests for SC-004 (query 100 scenes <500ms), SC-005 (query 50 characters <500ms), SC-006 (query 500 lines <1s)
- [ ] T061 [P] Add structured logging for all scene, character, and line operations
- [ ] T062 [P] Review and update documentation in quickstart.md if implementation differs
- [ ] T063 [P] Code cleanup and refactoring across all service modules
- [ ] T064 [P] Verify all error messages are user-friendly and don't leak sensitive information
- [ ] T065 [P] Run quickstart.md validation to ensure all examples work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) and User Story 2 (P1) can proceed in parallel after Foundational
  - User Story 3 (P2) depends on User Stories 1 and 2 (needs scenes and characters to exist)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories, can run in parallel with US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 (needs scenes) and US2 (needs characters) for full functionality, but can be tested independently with existing test data

### Within Each User Story

- Tests (REQUIRED) MUST be written and FAIL before implementation
- Validation schemas before services
- Access control utilities before services
- Services before API routes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- T009 and T010 in Foundational phase can run in parallel (different tables)
- User Stories 1 and 2 can start in parallel after Foundational phase completes
- All tests for a user story marked [P] can run in parallel
- Validation schemas, access control utilities, and type definitions within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (US1 and US2)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Create unit test for scene service in tests/unit/scenes/service.test.ts"
Task: "Create unit test for scene validation in tests/unit/scenes/validation.test.ts"
Task: "Create unit test for scene access control in tests/unit/scenes/access.test.ts"
Task: "Create integration test for scene CRUD operations in tests/integration/scenes.test.ts"
Task: "Create contract test for GET /api/scripts/[id]/scenes in tests/contract/api/scenes.test.ts"
Task: "Create contract test for POST /api/scripts/[id]/scenes in tests/contract/api/scenes.test.ts"

# Launch validation and access control utilities together:
Task: "Create scene validation schema in src/lib/scenes/validation.ts"
Task: "Create scene access control utility in src/lib/scenes/access.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Create unit test for character service in tests/unit/characters/service.test.ts"
Task: "Create unit test for character validation in tests/unit/characters/validation.test.ts"
Task: "Create unit test for character access control in tests/unit/characters/access.test.ts"
Task: "Create integration test for character CRUD operations in tests/integration/characters.test.ts"
Task: "Create contract test for GET /api/scripts/[id]/characters in tests/contract/api/characters.test.ts"
Task: "Create contract test for POST /api/scripts/[id]/characters in tests/contract/api/characters.test.ts"

# Launch validation and access control utilities together:
Task: "Create character validation schema in src/lib/characters/validation.ts"
Task: "Create character access control utility in src/lib/characters/access.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Scenes) - can run in parallel with Phase 4
4. Complete Phase 4: User Story 2 (Characters) - can run in parallel with Phase 3
5. **STOP and VALIDATE**: Test User Stories 1 and 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Scenes) → Test independently → Deploy/Demo
3. Add User Story 2 (Characters) → Test independently → Deploy/Demo (MVP!)
4. Add User Story 3 (Lines) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Scenes)
   - Developer B: User Story 2 (Characters)
3. Once US1 and US2 are complete:
   - Developer A + B: User Story 3 (Lines) together or split tasks
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- User Stories 1 and 2 (both P1) can be implemented in parallel after Foundational phase
- User Story 3 requires scenes and characters to exist, but can be tested independently with test data

