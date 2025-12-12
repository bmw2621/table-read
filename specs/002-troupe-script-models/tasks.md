# Tasks: Troupe and Script Data Models

**Input**: Design documents from `/specs/002-troupe-script-models/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED per constitution (Test-First, NON-NEGOTIABLE). All tests must be written BEFORE implementation (TDD).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and testing framework configuration

- [ ] T001 Install Jest testing dependencies in package.json (jest, @types/jest, ts-jest, @testing-library/react, @testing-library/jest-dom, @testing-library/node, jest-environment-node)
- [ ] T002 [P] Create Jest configuration file jest.config.ts at repository root
- [ ] T003 [P] Create tests/setup.ts for Jest setup with @testing-library/jest-dom import
- [ ] T004 [P] Update package.json scripts section with test, test:watch, and test:coverage commands
- [ ] T005 [P] Create tests directory structure (tests/contract/, tests/integration/, tests/unit/troupes/, tests/unit/scripts/, tests/e2e/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Extend database schema in src/lib/db/schema.ts with troupes table (id, directorId, createdAt, updatedAt) with restrict on directorId deletion (prevent director deletion if troupe exists)
- [ ] T007 [P] Extend database schema in src/lib/db/schema.ts with troupeMemberships table (id, userId, troupeId, createdAt, updatedAt) with indexes
- [ ] T008 [P] Extend database schema in src/lib/db/schema.ts with scripts table (id, title, userId, troupeId, createdAt, updatedAt) with indexes and cascade delete on troupeId (troupe-owned scripts deleted when troupe deleted)
- [ ] T009 Generate database migration using yarn db:gen command
- [ ] T010 Review generated migration SQL in drizzle/ directory
- [ ] T011 Apply database migration using yarn db:push or yarn db:migrate

**Checkpoint**: Foundation ready - database schema extended, migration applied. User story implementation can now begin.

---

## Phase 3: User Story 1 - Create and Manage Troupes (Priority: P1) 🎯 MVP

**Goal**: Users can create troupes and establish membership relationships. When a user creates a troupe, they become the "director" with exclusive management permissions including approving new members, removing members, and deleting the troupe.

**Independent Test**: Can be fully tested by creating a troupe, verifying the creator becomes the director, and testing director permissions for member management and troupe deletion.

### Tests for User Story 1 (TDD - Write FIRST, ensure they FAIL)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T012 [P] [US1] Create unit test for troupe permissions in tests/unit/troupes/permissions.test.ts (isDirector, canManageTroupe functions)
- [ ] T013 [P] [US1] Create unit test for troupe service in tests/unit/troupes/service.test.ts (createTroupe, approveMember, removeMember, deleteTroupe functions)
- [ ] T014 [P] [US1] Create integration test for troupe CRUD operations in tests/integration/troupes.test.ts (create, list, get, delete troupe)
- [ ] T015 [P] [US1] Create integration test for membership management in tests/integration/membership.test.ts (approve member, remove member, director-only enforcement)
- [ ] T016 [P] [US1] Create contract test for GET /api/troupes in tests/contract/api/troupes.test.ts
- [ ] T017 [P] [US1] Create contract test for POST /api/troupes in tests/contract/api/troupes.test.ts
- [ ] T018 [P] [US1] Create contract test for GET /api/troupes/[id] in tests/contract/api/troupes.test.ts
- [ ] T019 [P] [US1] Create contract test for DELETE /api/troupes/[id] in tests/contract/api/troupes.test.ts
- [ ] T020 [P] [US1] Create contract test for POST /api/troupes/[id]/members in tests/contract/api/troupes.test.ts
- [ ] T021 [P] [US1] Create contract test for DELETE /api/troupes/[id]/members/[userId] in tests/contract/api/troupes.test.ts

### Implementation for User Story 1

- [ ] T022 [P] [US1] Create troupe validation schema in src/lib/troupes/validation.ts (approveMemberSchema with Zod)
- [ ] T023 [P] [US1] Create troupe permissions utility in src/lib/troupes/permissions.ts (isDirector, canManageTroupe functions)
- [ ] T024 [US1] Create troupe service in src/lib/troupes/service.ts (createTroupe, approveMember, removeMember, deleteTroupe functions)
- [ ] T025 [US1] Create GET /api/troupes route in src/app/api/troupes/route.ts (list user's troupes with member counts)
- [ ] T026 [US1] Create POST /api/troupes route in src/app/api/troupes/route.ts (create troupe, user becomes director and first member)
- [ ] T027 [US1] Create GET /api/troupes/[id] route in src/app/api/troupes/[id]/route.ts (get troupe details with members list)
- [ ] T028 [US1] Create DELETE /api/troupes/[id] route in src/app/api/troupes/[id]/route.ts (delete troupe, director only, cascades to memberships and troupe-owned scripts)
- [ ] T029 [US1] Create POST /api/troupes/[id]/members route in src/app/api/troupes/[id]/members/route.ts (approve member, director only)
- [ ] T030 [US1] Create DELETE /api/troupes/[id]/members/[userId] route in src/app/api/troupes/[id]/members/[userId]/route.ts (remove member, director only)
- [ ] T031 [US1] Add error handling and logging for troupe operations in service and API routes
- [ ] T032 [US1] Add authentication checks to all troupe API routes (use existing auth() from @/lib/auth)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can create troupes, directors can manage memberships, and all director-only permissions are enforced.

---

## Phase 4: User Story 2 - Create Scripts with Ownership (Priority: P2)

**Goal**: Users can create scripts that are owned either by themselves (personal scripts) or by a troupe they belong to (shared scripts). Scripts have a title attribute that identifies them.

**Independent Test**: Can be fully tested by creating scripts owned by a user and scripts owned by a troupe, then verifying the ownership relationships are correctly stored.

### Tests for User Story 2 (TDD - Write FIRST, ensure they FAIL)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T033 [P] [US2] Create unit test for script service in tests/unit/scripts/service.test.ts (createScript function with user and troupe ownership)
- [ ] T034 [P] [US2] Create integration test for script CRUD operations in tests/integration/scripts.test.ts (create script with user ownership, create script with troupe ownership)
- [ ] T035 [P] [US2] Create contract test for GET /api/scripts in tests/contract/api/scripts.test.ts
- [ ] T036 [P] [US2] Create contract test for POST /api/scripts in tests/contract/api/scripts.test.ts
- [ ] T037 [P] [US2] Create contract test for GET /api/scripts/[id] in tests/contract/api/scripts.test.ts
- [ ] T038 [P] [US2] Create contract test for PUT /api/scripts/[id] in tests/contract/api/scripts.test.ts
- [ ] T039 [P] [US2] Create contract test for DELETE /api/scripts/[id] in tests/contract/api/scripts.test.ts

### Implementation for User Story 2

- [ ] T040 [P] [US2] Create script validation schema in src/lib/scripts/validation.ts (createScriptSchema, updateScriptSchema with Zod)
- [ ] T041 [US2] Create script service in src/lib/scripts/service.ts (createScript function with ownership validation)
- [ ] T042 [US2] Create GET /api/scripts route in src/app/api/scripts/route.ts (list scripts - basic implementation, access control in US3)
- [ ] T043 [US2] Create POST /api/scripts route in src/app/api/scripts/route.ts (create script with user or troupe ownership)
- [ ] T044 [US2] Create GET /api/scripts/[id] route in src/app/api/scripts/[id]/route.ts (get script details - basic implementation, access control in US3)
- [ ] T045 [US2] Create PUT /api/scripts/[id] route in src/app/api/scripts/[id]/route.ts (update script title, owner only)
- [ ] T046 [US2] Create DELETE /api/scripts/[id] route in src/app/api/scripts/[id]/route.ts (delete script, owner only)
- [ ] T047 [US2] Add error handling and logging for script operations in service and API routes
- [ ] T048 [US2] Add authentication checks to all script API routes (use existing auth() from @/lib/auth)
- [ ] T049 [US2] Add validation for troupe membership when creating troupe-owned scripts (user must be member of troupe)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can create troupes and manage memberships, and users can create scripts with user or troupe ownership.

---

## Phase 5: User Story 3 - Access Scripts Through Troupe Membership (Priority: P3)

**Goal**: Users can access scripts that belong to troupes they are members of. When a script belongs to a troupe, all members of that troupe have access to it.

**Independent Test**: Can be fully tested by creating a troupe, adding users to it, creating a script owned by the troupe, and verifying all troupe members can access the script.

### Tests for User Story 3 (TDD - Write FIRST, ensure they FAIL)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T050 [P] [US3] Create unit test for script access control in tests/unit/scripts/access.test.ts (canAccessScript function)
- [ ] T051 [P] [US3] Create integration test for script access control in tests/integration/scripts.test.ts (troupe member access, non-member denial, multiple troupes)
- [ ] T052 [P] [US3] Update contract test for GET /api/scripts in tests/contract/api/scripts.test.ts (verify accessible scripts include troupe-owned scripts)
- [ ] T053 [P] [US3] Update contract test for GET /api/scripts/[id] in tests/contract/api/scripts.test.ts (verify access control enforcement)

### Implementation for User Story 3

- [ ] T054 [P] [US3] Create script access control utility in src/lib/scripts/access.ts (canAccessScript function)
- [ ] T055 [US3] Update script service in src/lib/scripts/service.ts (add getAccessibleScripts function that joins with troupe memberships)
- [ ] T056 [US3] Update GET /api/scripts route in src/app/api/scripts/route.ts (use getAccessibleScripts to return user-owned + troupe-owned scripts)
- [ ] T057 [US3] Update GET /api/scripts/[id] route in src/app/api/scripts/[id]/route.ts (add access control check using canAccessScript)
- [ ] T058 [US3] Update PUT /api/scripts/[id] route in src/app/api/scripts/[id]/route.ts (add access control check for troupe-owned scripts)
- [ ] T059 [US3] Update DELETE /api/scripts/[id] route in src/app/api/scripts/[id]/route.ts (add access control check for troupe-owned scripts)
- [ ] T060 [US3] Add integration test for user leaving troupe losing script access in tests/integration/scripts.test.ts
- [ ] T061 [US3] Optimize getAccessibleScripts query for performance (SC-007: <1 second for 1000 scripts)

**Checkpoint**: All user stories should now be independently functional. Users can create troupes, manage memberships, create scripts, and access scripts through troupe membership with proper access control.

---

## Phase 6: E2E Tests (Critical User Flows)

**Purpose**: End-to-end tests for critical user flows as required by constitution

> **NOTE: E2E tests verify complete user journeys across all system boundaries**

- [ ] T062 [P] Create E2E test for troupe creation and director assignment flow in tests/e2e/troupe-creation.test.ts (user creates troupe, becomes director, automatically added as member)
- [ ] T063 [P] Create E2E test for script creation and access flow in tests/e2e/script-access.test.ts (user creates script, troupe member creates troupe script, access verification)
- [ ] T064 [P] Create E2E test for membership management flow in tests/e2e/membership-management.test.ts (director approves member, removes member, non-director attempts blocked)
- [ ] T065 [P] Create E2E test for access control flow in tests/e2e/access-control.test.ts (troupe member accesses troupe script, non-member denied, user leaves troupe loses access)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T066 [P] Add structured logging for all troupe operations (DEBUG, INFO, WARN, ERROR levels)
- [ ] T067 [P] Add structured logging for all script operations (DEBUG, INFO, WARN, ERROR levels)
- [ ] T068 [P] Performance testing for troupe operations (SC-001: <5 seconds troupe creation, SC-008: <2 seconds member management)
- [ ] T069 [P] Performance testing for script operations (SC-002: <3 seconds script creation, SC-007: <1 second for 1000 scripts)
- [ ] T070 [P] Performance testing for scale requirements (SC-005: 50+ troupes per user, SC-006: 100+ members per troupe)
- [ ] T071 [P] Add database query optimization and index verification
- [ ] T072 [P] Add comprehensive error messages for all API endpoints
- [ ] T073 [P] Add input validation error handling with clear user-friendly messages
- [ ] T074 [P] Code cleanup and refactoring across all service and API route files
- [ ] T075 [P] Update documentation in quickstart.md with any implementation changes
- [ ] T076 [P] Run quickstart.md validation to ensure all examples work correctly
- [ ] T077 [P] Security audit: verify all permission checks are enforced, no SQL injection risks, proper authentication on all routes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Depends on User Story 1 for troupe membership validation
  - User Story 3 (P3): Can start after Foundational - Depends on User Story 1 (troupe membership) and User Story 2 (script creation)
- **E2E Tests (Phase 6)**: Depends on all desired user stories being complete (tests complete user flows)
- **Polish (Phase 7)**: Depends on all desired user stories and E2E tests being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Requires troupe membership check (from US1) for troupe-owned script creation
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires both US1 (troupe membership) and US2 (script creation) to be complete

### Within Each User Story

- Tests (REQUIRED per constitution) MUST be written and FAIL before implementation (TDD)
- Validation schemas before services
- Services before API routes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: All Setup tasks marked [P] can run in parallel (T002, T003, T004, T005)
- **Phase 2**: All schema extension tasks marked [P] can run in parallel (T007, T008)
- **Phase 3 (US1)**: 
  - All test tasks marked [P] can run in parallel (T012-T021)
  - Validation and permissions tasks marked [P] can run in parallel (T022, T023)
- **Phase 4 (US2)**:
  - All test tasks marked [P] can run in parallel (T033-T039)
  - Validation task marked [P] can run independently (T040)
- **Phase 5 (US3)**:
  - All test tasks marked [P] can run in parallel (T050-T053)
  - Access control utility marked [P] can run independently (T054)
- **Phase 6**: All E2E test tasks marked [P] can run in parallel (T062-T065)
- **Phase 7**: All Polish tasks marked [P] can run in parallel (T066-T077)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (TDD - write first):
Task: "Create unit test for troupe permissions in tests/unit/troupes/permissions.test.ts"
Task: "Create unit test for troupe service in tests/unit/troupes/service.test.ts"
Task: "Create integration test for troupe CRUD operations in tests/integration/troupes.test.ts"
Task: "Create integration test for membership management in tests/integration/membership.test.ts"
Task: "Create contract test for GET /api/troupes in tests/contract/api/troupes.test.ts"
Task: "Create contract test for POST /api/troupes in tests/contract/api/troupes.test.ts"
Task: "Create contract test for GET /api/troupes/[id] in tests/contract/api/troupes.test.ts"
Task: "Create contract test for DELETE /api/troupes/[id] in tests/contract/api/troupes.test.ts"
Task: "Create contract test for POST /api/troupes/[id]/members in tests/contract/api/troupes.test.ts"
Task: "Create contract test for DELETE /api/troupes/[id]/members/[userId] in tests/contract/api/troupes.test.ts"

# Launch validation and permissions utilities together:
Task: "Create troupe validation schema in src/lib/troupes/validation.ts"
Task: "Create troupe permissions utility in src/lib/troupes/permissions.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Jest configuration)
2. Complete Phase 2: Foundational (Database schema extension and migration)
3. Complete Phase 3: User Story 1 (Troupe creation and management)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (all tests first, then implementation)
   - Developer B: Can start User Story 2 tests (but implementation waits for US1)
   - Developer C: Can start User Story 3 tests (but implementation waits for US1 and US2)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD MANDATORY**: Verify tests fail before implementing (constitution requirement)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All API routes require authentication (use existing auth() from @/lib/auth)
- All inputs must be validated with Zod schemas
- All permission checks must be enforced at service layer
- Performance targets: SC-001 (<5s troupe creation), SC-002 (<3s script creation), SC-007 (<1s for 1000 scripts), SC-008 (<2s member management)

---

## Task Summary

- **Total Tasks**: 77
- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 6 tasks
- **Phase 3 (User Story 1)**: 20 tasks (10 tests + 10 implementation)
- **Phase 4 (User Story 2)**: 17 tasks (7 tests + 10 implementation)
- **Phase 5 (User Story 3)**: 12 tasks (4 tests + 8 implementation)
- **Phase 6 (E2E Tests)**: 4 tasks
- **Phase 7 (Polish)**: 12 tasks
- **Parallel Opportunities**: 49 tasks marked [P]

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 31 tasks

**Cascade Deletion Decisions** (resolved):
- **Troupe deletion**: Cascade delete troupe-owned scripts (simpler, prevents orphaned data)
- **Director deletion**: Restrict deletion if director has troupes (prevent orphaned troupes, safer than cascade)
- **User deletion**: Out of scope (users assumed to exist per spec assumptions)

