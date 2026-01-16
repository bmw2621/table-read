import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use TEST_DATABASE_URL for tests, fall back to DATABASE_URL for production
const databaseUrl =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or TEST_DATABASE_URL environment variable is required"
  );
}

const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient, { schema });
