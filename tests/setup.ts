// Test setup file (compatible with bun test)
import "@testing-library/jest-dom";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables for tests
// Priority: .env.test > .env.local > .env
const envPath = resolve(process.cwd(), ".env.test");
const envLocalPath = resolve(process.cwd(), ".env.local");
const envDefaultPath = resolve(process.cwd(), ".env");

// Try loading in priority order (dotenv won't override existing env vars)
config({ path: envDefaultPath });
config({ path: envLocalPath, override: false });
config({ path: envPath, override: true }); // .env.test takes highest priority
