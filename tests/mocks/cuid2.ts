// Mock for @paralleldrive/cuid2 to avoid ES module issues in Jest
let counter = 0;

export function createId(): string {
  return `mock-id-${Date.now()}-${counter++}`;
}

export function init() {
  // Mock init function
}

export function getConstants() {
  // Mock getConstants function
  return {};
}

export function isCuid() {
  // Mock isCuid function
  return false;
}

