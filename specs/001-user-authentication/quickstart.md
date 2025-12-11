# Quickstart: User Authentication Implementation

**Feature**: User Authentication  
**Date**: 2025-12-10  
**Branch**: `001-user-authentication`

This guide provides a quick reference for implementing the user authentication feature.

## Prerequisites

- Next.js 15.1.0 project
- TypeScript 5.6.3
- PostgreSQL database
- Node.js 18+ (or version compatible with Next.js 15)

## Installation Steps

### 1. Install Dependencies

```bash
# Core authentication and database
npm install next-auth@latest @auth/drizzle-adapter@latest
npm install drizzle-orm@latest drizzle-kit@latest --save-dev
npm install postgres@latest

# Type definitions (if needed)
npm install @types/pg --save-dev
```

### 2. Environment Configuration

Create or update `.env.local`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/table_read

# Auth.js
AUTH_SECRET=your-secret-here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000  # Development URL
```

Generate AUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Database Setup

#### Create Database Schema

Create `src/lib/db/schema.ts`:

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name"),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password").notNull(), // Hashed by auth.js
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});
```

#### Database Connection

Create `src/lib/db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const queryClient = postgres(process.env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });
```

#### Drizzle Configuration

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### Generate and Apply Migrations

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration (development)
npx drizzle-kit push

# Or use migrations in production
npx drizzle-kit migrate
```

### 4. Auth.js Configuration

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs"; // or argon2

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt", // or "database" for database sessions
  },
  pages: {
    signIn: "/signin",
    signUp: "/signup",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.username, credentials.username as string))
          .limit(1);

        if (user.length === 0) {
          // Generic error - don't reveal if username exists
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user[0].password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user[0].id,
          username: user[0].username,
          name: user[0].name,
          email: user[0].email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
});
```

### 5. API Route Handler

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### 6. Registration Endpoint

Create `src/app/api/auth/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, name, email } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        name: name || null,
        email: email || null,
      })
      .returning();

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 7. Protected Route Middleware

Create `src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect routes (add your protected routes here)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## Implementation Checklist

- [ ] Install all dependencies
- [ ] Configure environment variables
- [ ] Create database schema
- [ ] Set up database connection
- [ ] Generate and apply migrations
- [ ] Configure Auth.js
- [ ] Create API route handlers
- [ ] Create registration endpoint
- [ ] Create sign in page/component
- [ ] Create sign up page/component
- [ ] Create protected route middleware
- [ ] Add password validation rules
- [ ] Implement error handling
- [ ] Add logging
- [ ] Write tests (TDD)

## Testing

### Manual Testing

1. **Registration**:
   - Navigate to `/signup`
   - Submit valid username and password
   - Verify account creation
   - Try duplicate username (should fail)

2. **Sign In**:
   - Navigate to `/signin`
   - Sign in with created credentials
   - Verify session is established
   - Try invalid credentials (should fail with generic error)

3. **Sign Out**:
   - While authenticated, sign out
   - Verify session is terminated
   - Try accessing protected route (should redirect)

4. **Protected Routes**:
   - Access protected route while unauthenticated (should redirect)
   - Access protected route while authenticated (should succeed)

## Next Steps

1. Implement UI components (sign in/sign up forms)
2. Add password strength validation
3. Add rate limiting
4. Implement session management UI
5. Add email verification (future)
6. Add password reset (future)

## Troubleshooting

**Database Connection Issues**:
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Verify database exists

**Auth.js Issues**:
- Verify `AUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your app URL
- Review auth.js logs for errors

**Migration Issues**:
- Check schema matches database
- Verify drizzle-kit configuration
- Review migration files for errors

## References

- [Auth.js Documentation](https://authjs.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Feature Spec](./spec.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/auth-api.md)

