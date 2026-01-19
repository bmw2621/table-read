# Testing Best Practices

**Version**: 1.0.0  
**Last Updated**: 2025-12-12  
**Purpose**: Guidelines for writing maintainable, isolated tests

## Test Isolation

### Problem: Test Interference

When tests pass individually but fail when run together, this indicates **test isolation issues**. Common causes:

1. **Shared mocks** that aren't properly reset between tests
2. **Global state** that persists across test files
3. **Module-level mocks** that interfere with other test files
4. **Spy conflicts** when multiple test files spy on the same functions

### Solution: Use Spies Instead of Mocks

**When to use spies:**

- When testing service functions that depend on other services
- When you need to verify function calls while still allowing real implementation
- When multiple test files need to test the same dependencies
- When tests pass individually but fail when run together

**When to use mocks:**

- For external dependencies (databases, APIs, file system)
- For dependencies that don't have real implementations in tests
- For dependencies that are expensive or have side effects

## Spy Pattern

### Unit Tests Pattern

```typescript
// ❌ AVOID: Module-level mocks that can interfere
jest.mock("@/lib/scripts/access", () => ({
  canAccessScript: jest.fn(),
}));

// ✅ PREFER: Spies created in beforeAll, restored in afterAll
import * as scriptAccess from "@/lib/scripts/access";

let canAccessScript: jest.SpyInstance;

beforeAll(() => {
  // Create spies once before all tests
  canAccessScript = jest.spyOn(scriptAccess, "canAccessScript");
});

beforeEach(() => {
  jest.resetAllMocks();
  // Reset spies
  canAccessScript.mockReset();
  // Set default behavior
  canAccessScript.mockResolvedValue(true);
});

afterAll(() => {
  // Restore all spies to avoid affecting other tests
  canAccessScript.mockRestore();
});
```

### Contract Tests Pattern

```typescript
// Import services - these will be real implementations
import * as sceneService from "@/lib/scenes/service";

// Create spies for services
let createScene: jest.SpyInstance;
let getScenesByScript: jest.SpyInstance;

beforeAll(() => {
  // Create spies once before all tests
  createScene = jest.spyOn(sceneService, "createScene");
  getScenesByScript = jest.spyOn(sceneService, "getScenesByScript");
});

beforeEach(() => {
  jest.clearAllMocks();
  // Reset service spies
  createScene.mockReset();
  getScenesByScript.mockReset();
});

afterAll(() => {
  // Restore all spies to original implementations
  createScene.mockRestore();
  getScenesByScript.mockRestore();
});
```

## Detection and Resolution

### Symptoms of Test Isolation Issues

1. ✅ Tests pass when run individually
2. ❌ Tests fail when run together
3. ❌ Different tests fail on each run
4. ❌ Tests pass in one order but fail in another

### Resolution Steps

1. **Identify shared dependencies**: Look for functions that are mocked/spied in multiple test files
2. **Convert mocks to spies**: Replace `jest.mock()` with `jest.spyOn()` for service dependencies
3. **Add proper cleanup**: Ensure `afterAll()` hooks restore all spies
4. **Reset between tests**: Use `mockReset()` in `beforeEach()` to clear call history
5. **Verify isolation**: Run all tests together to confirm fixes

## Best Practices

### 1. Spies for Service Dependencies

Always use spies for:

- Service layer functions
- Access control functions
- Permission checks
- Any function that has a real implementation

### 2. Mocks for External Dependencies

Use mocks for:

- Database connections (db.select, db.insert, etc.)
- External APIs
- File system operations
- Environment variables

### 3. Proper Cleanup

Always restore spies in `afterAll()`:

```typescript
afterAll(() => {
  spy1.mockRestore();
  spy2.mockRestore();
  // ... restore all spies
});
```

### 4. Reset Between Tests

Reset spies in `beforeEach()` to clear call history:

```typescript
beforeEach(() => {
  jest.resetAllMocks();
  spy1.mockReset();
  spy2.mockReset();
  // Set default behaviors
});
```

### 5. Test Independence

Each test should:

- Set up its own mocks/spies
- Not depend on state from previous tests
- Clean up after itself
- Work in any order

## Examples

### ✅ Good: Isolated Unit Test

```typescript
import * as scriptAccess from "@/lib/scripts/access";
import * as scriptService from "@/lib/scripts/service";
import { createScene } from "@/lib/scenes/service";

let canAccessScript: jest.SpyInstance;
let getScript: jest.SpyInstance;

beforeAll(() => {
  canAccessScript = jest.spyOn(scriptAccess, "canAccessScript");
  getScript = jest.spyOn(scriptService, "getScript");
});

beforeEach(() => {
  jest.resetAllMocks();
  getScript.mockReset();
  canAccessScript.mockReset();
  getScript.mockResolvedValue(mockScript);
  canAccessScript.mockResolvedValue(true);
});

afterAll(() => {
  canAccessScript.mockRestore();
  getScript.mockRestore();
});
```

### ❌ Bad: Module-Level Mock

```typescript
// This can interfere with other test files
jest.mock("@/lib/scripts/access", () => ({
  canAccessScript: jest.fn(),
}));

// No cleanup - spy persists across test files
```

## References

- Jest Spies: https://jestjs.io/docs/jest-object#jestspyonobject-methodname
- Test Isolation: https://jestjs.io/docs/setup-teardown
- This pattern was established in feature `003-scenes-characters-lines` to resolve test isolation issues
