<!--
Sync Impact Report:
Version change: (none) → 1.0.0
Modified principles: (none - initial fill-out)
Added sections: Development Workflow, Quality Standards
Removed sections: (none)
Templates requiring updates:
  ✅ .specify/templates/plan-template.md (Constitution Check section exists)
  ✅ .specify/templates/spec-template.md (structure compatible)
  ✅ .specify/templates/tasks-template.md (structure compatible)
  ✅ .cursor/commands/*.md (no agent-specific references found)
Follow-up TODOs: (none)
-->

# Table Read Constitution

## Core Principles

### I. Component-First
Every feature starts as a standalone, reusable component or module;
Components must be self-contained, independently testable, and documented;
Clear purpose required - no organizational-only components;
Components expose well-defined interfaces and can be composed into larger features.

### II. API/Route Interface
Every feature exposes functionality via well-defined API routes or Next.js routes;
RESTful conventions: clear HTTP methods, status codes, error handling;
Support JSON for machine consumption and human-readable formats for debugging;
Server actions and API routes must have consistent request/response patterns.

### III. Test-First (NON-NEGOTIABLE)
TDD mandatory: Tests written → User approved → Tests fail → Then implement;
Red-Green-Refactor cycle strictly enforced;
Unit tests for business logic, integration tests for API routes, E2E tests for user flows;
No production code without corresponding tests.

### IV. Integration Testing
Focus areas requiring integration tests: New API route contract tests, Contract changes,
Inter-service communication, Database interactions, Authentication flows, Shared schemas;
Integration tests verify end-to-end behavior across component boundaries;
Contract tests ensure API stability and backward compatibility.

### V. Observability & Simplicity
Structured logging required for all operations; Log levels (DEBUG, INFO, WARN, ERROR)
must be used appropriately; Error tracking and monitoring for production issues;
Start simple, YAGNI principles - avoid premature optimization;
Complexity must be justified with clear rationale; Prefer explicit over implicit code.

## Development Workflow

### Code Review Requirements
New features will be developed on a new git branch using a branch nameing convention of 
prefix/description, with feature, fix, docs, and chore as prefixes, and kebab case for description.
All PRs must verify constitution compliance before merge;
At least one approval required; Tests must pass; Linting and formatting checks must pass;
Complexity violations must be documented in plan.md Complexity Tracking section.

### Testing Gates
Unit tests required for all business logic; Integration tests required for API routes;
E2E tests required for critical user flows; Test coverage thresholds enforced;
All tests must pass before merge; Tests must be written before implementation (TDD);
UI rendering tests are not necessary - focus testing efforts on business logic only.

### Deployment Process
All features must be tested in staging before production;
Database migrations must be backward compatible or include rollback plan;
Breaking API changes require versioning strategy; Feature flags for gradual rollouts.

## Quality Standards

### Code Quality
Strict typing enabled; Linting and formatting configured and enforced;
No untyped or loosely-typed code without explicit justification; Consistent error handling patterns;
Documentation for public APIs and complex logic.

### Performance Standards
Page load times under 2 seconds for initial render;
API response times under 200ms for p95;
Database queries optimized with proper indexing;
Image optimization and code splitting required.

### Security Requirements
Authentication required for protected routes; Input validation on all user inputs;
SQL injection prevention via parameterized queries; XSS prevention via proper escaping;
CSRF protection for state-changing operations; Secrets managed via environment variables.

## Governance

This constitution supersedes all other development practices and guidelines.
Amendments require: documentation of rationale, team approval, migration plan for
existing code, version bump according to semantic versioning rules.

All PRs and code reviews must verify compliance with these principles.
Complexity must be justified in plan.md Complexity Tracking section.
Use `.specify/memory/agent-file-template.md` (when generated) for runtime development
guidance and technology-specific patterns.

**Version**: 1.0.0 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-09
