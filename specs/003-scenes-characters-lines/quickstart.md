# Quickstart: Script Content Data Model Implementation

**Feature**: Script Content Data Model - Scenes, Characters, and Lines  
**Date**: 2025-12-12  
**Branch**: `003-scenes-characters-lines`

This guide provides a quick reference for implementing the script content data model feature.

## Prerequisites

- Next.js 15.1.0 project with user authentication and script management implemented
- TypeScript 5.6.3
- PostgreSQL database with scripts table (from feature 002)
- drizzle-orm configured
- Existing authentication via next-auth
- Jest testing framework configured (from feature 002)

## Installation Steps

### 1. Database Schema Extension

Extend `src/lib/db/schema.ts` with scene, character, and line tables:

```typescript
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { scripts } from "./schema"; // Existing scripts table

// Scene table
export const scenes = pgTable(
  "scene",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    scriptId: text("scriptId")
      .notNull()
      .references(() => scripts.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    scriptIdIdx: index("scene_scriptId_idx").on(table.scriptId),
  })
);

// Character table
export const characters = pgTable(
  "character",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    scriptId: text("scriptId")
      .notNull()
      .references(() => scripts.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    scriptIdIdx: index("character_scriptId_idx").on(table.scriptId),
  })
);

// Line table
export const lines = pgTable(
  "line",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    text: text("text").notNull(),
    characterId: text("characterId").references(() => characters.id, {
      onDelete: "set null",
    }),
    sceneId: text("sceneId")
      .notNull()
      .references(() => scenes.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    sceneIdIdx: index("line_sceneId_idx").on(table.sceneId),
    characterIdIdx: index("line_characterId_idx").on(table.characterId),
  })
);
```

### 2. Generate and Apply Migration

```bash
# Generate migration
yarn db:gen

# Review generated migration in drizzle/ directory

# Apply migration
yarn db:push
# Or use migrations:
yarn db:migrate
```

### 3. Create Validation Schemas

Create `src/lib/scenes/validation.ts`:

```typescript
import { z } from "zod";

export const createSceneSchema = z.object({
  scriptId: z.string().min(1, "Script ID is required"),
});

export type CreateSceneInput = z.infer<typeof createSceneSchema>;
```

Create `src/lib/characters/validation.ts`:

```typescript
import { z } from "zod";

export const createCharacterSchema = z.object({
  scriptId: z.string().min(1, "Script ID is required"),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
```

Create `src/lib/lines/validation.ts`:

```typescript
import { z } from "zod";

export const createLineSchema = z.object({
  text: z.string().min(1, "Text is required"),
  characterId: z.string().min(1, "Character ID is required").optional(),
  sceneId: z.string().min(1, "Scene ID is required"),
});

export type CreateLineInput = z.infer<typeof createLineSchema>;
```

### 4. Create Access Control Utilities

Create `src/lib/scenes/access.ts`:

```typescript
import { canAccessScript } from "@/lib/scripts/access";
import { db } from "@/lib/db";
import { scenes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function canAccessScene(
  sceneId: string,
  userId: string
): Promise<boolean> {
  const [scene] = await db
    .select()
    .from(scenes)
    .where(eq(scenes.id, sceneId))
    .limit(1);

  if (!scene) {
    return false;
  }

  // Scene access inherits from script access
  return canAccessScript(scene.scriptId, userId);
}
```

Create `src/lib/characters/access.ts`:

```typescript
import { canAccessScript } from "@/lib/scripts/access";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function canAccessCharacter(
  characterId: string,
  userId: string
): Promise<boolean> {
  const [character] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!character) {
    return false;
  }

  // Character access inherits from script access
  return canAccessScript(character.scriptId, userId);
}
```

Create `src/lib/lines/access.ts`:

```typescript
import { canAccessScript } from "@/lib/scripts/access";
import { db } from "@/lib/db";
import { lines, scenes, characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function canAccessLine(
  lineId: string,
  userId: string
): Promise<boolean> {
  const [line] = await db
    .select()
    .from(lines)
    .where(eq(lines.id, lineId))
    .limit(1);

  if (!line) {
    return false;
  }

  // Line access inherits from script access via scene
  return canAccessScene(line.sceneId, userId);
}
```

### 5. Create Service Layer

Create `src/lib/scenes/service.ts`:

```typescript
import { db } from "@/lib/db";
import { scenes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessScript } from "@/lib/scripts/access";

export async function createScene(scriptId: string, userId: string) {
  // Verify access to script
  if (!(await canAccessScript(scriptId, userId))) {
    throw new Error("You do not have access to this script");
  }

  const [scene] = await db
    .insert(scenes)
    .values({
      scriptId,
    })
    .returning();

  return scene;
}

export async function getScenesByScript(scriptId: string, userId: string) {
  // Verify access to script
  if (!(await canAccessScript(scriptId, userId))) {
    throw new Error("You do not have access to this script");
  }

  return db.select().from(scenes).where(eq(scenes.scriptId, scriptId));
}
```

Create `src/lib/characters/service.ts`:

```typescript
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessScript } from "@/lib/scripts/access";

export async function createCharacter(scriptId: string, userId: string) {
  // Verify access to script
  if (!(await canAccessScript(scriptId, userId))) {
    throw new Error("You do not have access to this script");
  }

  const [character] = await db
    .insert(characters)
    .values({
      scriptId,
    })
    .returning();

  return character;
}

export async function getCharactersByScript(scriptId: string, userId: string) {
  // Verify access to script
  if (!(await canAccessScript(scriptId, userId))) {
    throw new Error("You do not have access to this script");
  }

  return db.select().from(characters).where(eq(characters.scriptId, scriptId));
}
```

Create `src/lib/lines/service.ts`:

```typescript
import { db } from "@/lib/db";
import { lines, scenes, characters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessScript } from "@/lib/scripts/access";

export async function createLine(
  text: string,
  sceneId: string,
  userId: string,
  characterId?: string
) {
  // Get scene to verify access
  const [scene] = await db
    .select()
    .from(scenes)
    .where(eq(scenes.id, sceneId))
    .limit(1);

  if (!scene) {
    throw new Error("Scene not found");
  }

  // Verify access to script
  if (!(await canAccessScript(scene.scriptId, userId))) {
    throw new Error("You do not have access to this script");
  }

  // If characterId is provided, validate it belongs to same script
  if (characterId) {
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!character) {
      throw new Error("Character not found");
    }

    // Verify character and scene belong to same script
    if (character.scriptId !== scene.scriptId) {
      throw new Error("Character and scene must belong to the same script");
    }
  }

  const [line] = await db
    .insert(lines)
    .values({
      text,
      characterId: characterId || null,
      sceneId,
    })
    .returning();

  return line;
}

export async function getLinesByScene(sceneId: string, userId: string) {
  // Get scene to verify access
  const [scene] = await db
    .select()
    .from(scenes)
    .where(eq(scenes.id, sceneId))
    .limit(1);

  if (!scene) {
    throw new Error("Scene not found");
  }

  // Verify access to script
  if (!(await canAccessScript(scene.scriptId, userId))) {
    throw new Error("You do not have access to this scene's script");
  }

  return db.select().from(lines).where(eq(lines.sceneId, sceneId));
}
```

### 6. Create API Routes

Create `src/app/api/scripts/[id]/scenes/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createScene, getScenesByScript } from "@/lib/scenes/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const { id: scriptId } = await params;

  try {
    const scenes = await getScenesByScript(scriptId, session.user.id);
    return NextResponse.json({
      scenes,
      status: 200,
      ok: true,
    });
  } catch (error: any) {
    if (error.message.includes("access")) {
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
        message: "Script not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const { id: scriptId } = await params;

  try {
    const scene = await createScene(scriptId, session.user.id);
    return NextResponse.json({ scene, status: 201, ok: true }, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("access")) {
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
        message: "Script not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}
```

Create `src/app/api/scripts/[id]/characters/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createCharacter,
  getCharactersByScript,
} from "@/lib/characters/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const { id: scriptId } = await params;

  try {
    const characters = await getCharactersByScript(scriptId, session.user.id);
    return NextResponse.json({
      characters,
      status: 200,
      ok: true,
    });
  } catch (error: any) {
    if (error.message.includes("access")) {
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
        message: "Script not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const { id: scriptId } = await params;

  try {
    const character = await createCharacter(scriptId, session.user.id);
    return NextResponse.json(
      { character, status: 201, ok: true },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes("access")) {
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
        message: "Script not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}
```

Create `src/app/api/scenes/[id]/lines/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createLine, getLinesByScene } from "@/lib/lines/service";
import { createLineSchema } from "@/lib/lines/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const { id: sceneId } = await params;

  try {
    const lines = await getLinesByScene(sceneId, session.user.id);
    return NextResponse.json({
      lines,
      status: 200,
      ok: true,
    });
  } catch (error: any) {
    if (error.message.includes("access")) {
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
        message: "Scene not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const { id: sceneId } = await params;

  try {
    const body = await request.json();
    const validation = createLineSchema.safeParse({
      ...body,
      sceneId,
    });

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

    const line = await createLine(
      validation.data.text,
      sceneId,
      session.user.id,
      validation.data.characterId
    );

    return NextResponse.json({ line, status: 201, ok: true }, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("Character and scene")) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: error.message,
          status: 409,
          ok: false,
        },
        { status: 409 }
      );
    }
    if (error.message.includes("access")) {
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
    if (error.message.includes("not found")) {
      return NextResponse.json(
        {
          error: "NotFound",
          message: error.message,
          status: 404,
          ok: false,
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: "InternalServerError",
        message: "Failed to create line",
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

Create `tests/unit/scenes/service.test.ts`:

```typescript
import { createScene, getScenesByScript } from "@/lib/scenes/service";
import { db } from "@/lib/db";
import { scenes, scripts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Scene Service", () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(scenes);
    await db.delete(scripts);
  });

  it("should create scene when user has access to script", async () => {
    // Create test script
    const [script] = await db
      .insert(scripts)
      .values({
        title: "Test Script",
        userId: "test-user-id",
      })
      .returning();

    const scene = await createScene(script.id, "test-user-id");

    expect(scene.scriptId).toBe(script.id);

    const createdScenes = await db
      .select()
      .from(scenes)
      .where(eq(scenes.scriptId, script.id));

    expect(createdScenes.length).toBe(1);
  });
});
```

### Integration Tests Example

Create `tests/integration/scenes.test.ts`:

```typescript
import { GET, POST } from "@/app/api/scripts/[id]/scenes/route";
import { NextRequest } from "next/server";

describe("Scene API", () => {
  it("should create scene when authenticated and has access to script", async () => {
    // Mock auth session
    // Make request
    // Assert response
  });
});
```

## Next Steps

1. Implement remaining service functions (update, delete if needed)
2. Add comprehensive test coverage for all entities
3. Add error logging and monitoring
4. Performance testing for scale requirements (200 scenes, 100 characters, 1000 lines per scene)
5. Optimize queries with composite indexes if needed

## References

- [Data Model](./data-model.md)
- [API Contracts](./contracts/)
- [Research](./research.md)
