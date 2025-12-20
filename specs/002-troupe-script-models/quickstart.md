# Quickstart: Troupe and Script Data Models Implementation

**Feature**: Troupe and Script Data Models  
**Date**: 2025-12-12  
**Branch**: `002-troupe-script-models`

This guide provides a quick reference for implementing the troupe and script data models feature.

## Prerequisites

- Next.js 15.1.0 project with user authentication implemented
- TypeScript 5.6.3
- PostgreSQL database with users table
- drizzle-orm configured
- Existing authentication via next-auth

## Installation Steps

### 1. Install Testing Dependencies

```bash
# Jest and testing utilities
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/node jest-environment-node

# If using React Testing Library (for future UI components)
npm install --save-dev @testing-library/user-event
```

### 2. Configure Jest

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};

export default config;
```

Create `tests/setup.ts`:

```typescript
// Jest setup file
import '@testing-library/jest-dom';
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 3. Database Schema Extension

Extend `src/lib/db/schema.ts` with troupe and script tables:

```typescript
import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./schema"; // Existing users table

// Troupe table
export const troupes = pgTable(
  "troupe",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    directorId: text("directorId")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    directorIdIdx: index("troupe_directorId_idx").on(table.directorId),
  })
);

// Troupe membership junction table
export const troupeMemberships = pgTable(
  "troupeMembership",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    troupeId: text("troupeId")
      .notNull()
      .references(() => troupes.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("troupeMembership_userId_idx").on(table.userId),
    troupeIdIdx: index("troupeMembership_troupeId_idx").on(table.troupeId),
    userTroupeUnique: uniqueIndex("troupeMembership_userId_troupeId_idx").on(
      table.userId,
      table.troupeId
    ),
  })
);

// Script table with polymorphic ownership
export const scripts = pgTable(
  "script",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    title: text("title").notNull(),
    userId: text("userId")
      .references(() => users.id, { onDelete: "cascade" }),
    troupeId: text("troupeId")
      .references(() => troupes.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("script_userId_idx").on(table.userId),
    troupeIdIdx: index("script_troupeId_idx").on(table.troupeId),
  })
);
```

### 4. Generate and Apply Migration

```bash
# Generate migration
yarn db:gen

# Review generated migration in drizzle/ directory

# Apply migration
yarn db:push
# Or use migrations:
yarn db:migrate
```

### 5. Create Validation Schemas

Create `src/lib/troupes/validation.ts`:

```typescript
import { z } from "zod";

export const approveMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type ApproveMemberInput = z.infer<typeof approveMemberSchema>;
```

Create `src/lib/scripts/validation.ts`:

```typescript
import { z } from "zod";

export const createScriptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  troupeId: z.string().optional(),
}).refine(
  (data) => {
    // Application-level: exactly one owner (enforced in service)
    return true;
  },
  { message: "Script must have exactly one owner" }
);

export const updateScriptSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export type CreateScriptInput = z.infer<typeof createScriptSchema>;
export type UpdateScriptInput = z.infer<typeof updateScriptSchema>;
```

### 6. Create Permission Utilities

Create `src/lib/troupes/permissions.ts`:

```typescript
import { db } from "@/lib/db";
import { troupes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function isDirector(
  userId: string,
  troupeId: string
): Promise<boolean> {
  const troupe = await db
    .select()
    .from(troupes)
    .where(eq(troupes.id, troupeId))
    .limit(1);

  if (troupe.length === 0) {
    return false;
  }

  return troupe[0].directorId === userId;
}

export async function canManageTroupe(
  userId: string,
  troupeId: string
): Promise<boolean> {
  return isDirector(userId, troupeId);
}
```

### 7. Create Service Layer

Create `src/lib/troupes/service.ts`:

```typescript
import { db } from "@/lib/db";
import { troupes, troupeMemberships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isDirector } from "./permissions";
import { approveMemberSchema } from "./validation";

export async function createTroupe(directorId: string) {
  // Create troupe
  const [troupe] = await db
    .insert(troupes)
    .values({
      directorId,
    })
    .returning();

  // Add director as first member
  await db.insert(troupeMemberships).values({
    userId: directorId,
    troupeId: troupe.id,
  });

  return troupe;
}

export async function approveMember(
  troupeId: string,
  userId: string,
  directorId: string
) {
  // Check director permission
  if (!(await isDirector(directorId, troupeId))) {
    throw new Error("Only the director can approve members");
  }

  // Check for duplicate membership
  const existing = await db
    .select()
    .from(troupeMemberships)
    .where(
      and(
        eq(troupeMemberships.userId, userId),
        eq(troupeMemberships.troupeId, troupeId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("User is already a member");
  }

  // Create membership
  const [membership] = await db
    .insert(troupeMemberships)
    .values({
      userId,
      troupeId,
    })
    .returning();

  return membership;
}

export async function removeMember(
  troupeId: string,
  targetUserId: string,
  directorId: string
) {
  // Check director permission
  if (!(await isDirector(directorId, troupeId))) {
    throw new Error("Only the director can remove members");
  }

  // Prevent director from removing themselves
  if (targetUserId === directorId) {
    throw new Error("Director cannot remove themselves");
  }

  // Remove membership
  await db
    .delete(troupeMemberships)
    .where(
      and(
        eq(troupeMemberships.userId, targetUserId),
        eq(troupeMemberships.troupeId, troupeId)
      )
    );
}

export async function deleteTroupe(troupeId: string, directorId: string) {
  // Check director permission
  if (!(await isDirector(directorId, troupeId))) {
    throw new Error("Only the director can delete a troupe");
  }

  // Delete troupe (cascades to memberships)
  await db.delete(troupes).where(eq(troupes.id, troupeId));
}
```

Create `src/lib/scripts/service.ts`:

```typescript
import { db } from "@/lib/db";
import { scripts, troupeMemberships } from "@/lib/db/schema";
import { eq, or, and, isNull, isNotNull } from "drizzle-orm";
import { createScriptSchema, updateScriptSchema } from "./validation";

export async function createScript(
  title: string,
  userId: string,
  troupeId?: string
) {
  // Validate ownership: exactly one owner
  if (troupeId) {
    // Check user is member of troupe
    const membership = await db
      .select()
      .from(troupeMemberships)
      .where(
        and(
          eq(troupeMemberships.userId, userId),
          eq(troupeMemberships.troupeId, troupeId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      throw new Error("You are not a member of this troupe");
    }
  }

  const [script] = await db
    .insert(scripts)
    .values({
      title,
      userId: troupeId ? null : userId,
      troupeId: troupeId || null,
    })
    .returning();

  return script;
}

export async function getAccessibleScripts(userId: string) {
  // Get user-owned scripts
  const userScripts = await db
    .select()
    .from(scripts)
    .where(eq(scripts.userId, userId));

  // Get troupe memberships
  const memberships = await db
    .select({ troupeId: troupeMemberships.troupeId })
    .from(troupeMemberships)
    .where(eq(troupeMemberships.userId, userId));

  const troupeIds = memberships.map((m) => m.troupeId);

  // Get troupe-owned scripts
  const troupeScripts =
    troupeIds.length > 0
      ? await db
          .select()
          .from(scripts)
          .where(
            and(
              isNotNull(scripts.troupeId),
              or(...troupeIds.map((id) => eq(scripts.troupeId, id)))
            )
          )
      : [];

  return [...userScripts, ...troupeScripts];
}

export async function canAccessScript(
  scriptId: string,
  userId: string
): Promise<boolean> {
  const [script] = await db
    .select()
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .limit(1);

  if (!script) {
    return false;
  }

  // User-owned script
  if (script.userId === userId) {
    return true;
  }

  // Troupe-owned script: check membership
  if (script.troupeId) {
    const membership = await db
      .select()
      .from(troupeMemberships)
      .where(
        and(
          eq(troupeMemberships.userId, userId),
          eq(troupeMemberships.troupeId, script.troupeId)
        )
      )
      .limit(1);

    return membership.length > 0;
  }

  return false;
}
```

### 8. Create API Routes

Create `src/app/api/troupes/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createTroupe } from "@/lib/troupes/service";
import { db } from "@/lib/db";
import { troupes, troupeMemberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Get user's troupes
  const userTroupes = await db
    .select({
      troupe: troupes,
      isDirector: eq(troupes.directorId, userId),
    })
    .from(troupes)
    .innerJoin(
      troupeMemberships,
      eq(troupeMemberships.troupeId, troupes.id)
    )
    .where(eq(troupeMemberships.userId, userId));

  // Get member counts
  const troupesWithCounts = await Promise.all(
    userTroupes.map(async (item) => {
      const members = await db
        .select()
        .from(troupeMemberships)
        .where(eq(troupeMemberships.troupeId, item.troupe.id));

      return {
        ...item.troupe,
        isDirector: item.troupe.directorId === userId,
        memberCount: members.length,
      };
    })
  );

  return NextResponse.json({
    troupes: troupesWithCounts,
    status: 200,
    ok: true,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  try {
    const troupe = await createTroupe(session.user.id);
    return NextResponse.json(
      { troupe, status: 201, ok: true },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "InternalServerError",
        message: "Failed to create troupe",
        status: 500,
        ok: false,
      },
      { status: 500 }
    );
  }
}
```

Create `src/app/api/troupes/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteTroupe } from "@/lib/troupes/service";
import { db } from "@/lib/db";
import { troupes, troupeMemberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const [troupe] = await db
    .select()
    .from(troupes)
    .where(eq(troupes.id, params.id))
    .limit(1);

  if (!troupe) {
    return NextResponse.json(
      { error: "NotFound", message: "Troupe not found", status: 404, ok: false },
      { status: 404 }
    );
  }

  // Check membership
  const membership = await db
    .select()
    .from(troupeMemberships)
    .where(
      and(
        eq(troupeMemberships.userId, session.user.id),
        eq(troupeMemberships.troupeId, params.id)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "You are not a member of this troupe",
        status: 403,
        ok: false,
      },
      { status: 403 }
    );
  }

  const members = await db
    .select()
    .from(troupeMemberships)
    .where(eq(troupeMemberships.troupeId, params.id));

  return NextResponse.json({
    troupe: {
      ...troupe,
      isDirector: troupe.directorId === session.user.id,
      members,
    },
    status: 200,
    ok: true,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  try {
    await deleteTroupe(params.id, session.user.id);
    return NextResponse.json({
      message: "Troupe deleted successfully",
      status: 200,
      ok: true,
    });
  } catch (error: any) {
    if (error.message.includes("director")) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: error.message,
          status: 403,
          ok: false,
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      {
        error: "NotFound",
        message: "Troupe not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}
```

Create `src/app/api/scripts/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createScript, getAccessibleScripts } from "@/lib/scripts/service";
import { createScriptSchema } from "@/lib/scripts/validation";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const scripts = await getAccessibleScripts(session.user.id);

  return NextResponse.json({
    scripts: scripts.map((s) => ({
      ...s,
      ownerType: s.userId ? "user" : "troupe",
    })),
    pagination: {
      total: scripts.length,
      limit: 100,
      offset: 0,
      hasMore: false,
    },
    status: 200,
    ok: true,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const body = await request.json();
  const validation = createScriptSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "ValidationError",
        message: validation.error.errors[0].message,
        status: 400,
        ok: false,
      },
      { status: 400 }
    );
  }

  try {
    const script = await createScript(
      validation.data.title,
      session.user.id,
      validation.data.troupeId
    );
    return NextResponse.json(
      { script, status: 201, ok: true },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes("member")) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: error.message,
          status: 403,
          ok: false,
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      {
        error: "InternalServerError",
        message: "Failed to create script",
        status: 500,
        ok: false,
      },
      { status: 500 }
    );
  }
}
```

## Testing

### Unit Tests Example

Create `tests/unit/troupes/service.test.ts`:

```typescript
import { createTroupe, approveMember } from "@/lib/troupes/service";
import { db } from "@/lib/db";
import { troupes, troupeMemberships } from "@/lib/db/schema";

describe("Troupe Service", () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(troupeMemberships);
    await db.delete(troupes);
  });

  it("should create troupe with director as first member", async () => {
    const directorId = "test-director-id";
    const troupe = await createTroupe(directorId);

    expect(troupe.directorId).toBe(directorId);

    const members = await db
      .select()
      .from(troupeMemberships)
      .where(eq(troupeMemberships.troupeId, troupe.id));

    expect(members.length).toBe(1);
    expect(members[0].userId).toBe(directorId);
  });
});
```

### Integration Tests Example

Create `tests/integration/troupes.test.ts`:

```typescript
import { POST } from "@/app/api/troupes/route";
import { NextRequest } from "next/server";

describe("Troupe API", () => {
  it("should create troupe when authenticated", async () => {
    // Mock auth session
    // Make request
    // Assert response
  });
});
```

## Next Steps

1. Implement remaining API routes (member management, script CRUD)
2. Add comprehensive test coverage
3. Implement pagination for large result sets
4. Add error logging and monitoring
5. Performance testing for scale requirements (50+ troupes, 100+ members, 1000+ scripts)

## References

- [Data Model](./data-model.md)
- [API Contracts](./contracts/)
- [Research](./research.md)

