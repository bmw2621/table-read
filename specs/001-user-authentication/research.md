# Research: User Authentication Implementation

**Date**: 2025-12-10  
**Feature**: User Authentication with auth.js and drizzle-orm  
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Technology Choices

### Database: PostgreSQL

**Decision**: Use PostgreSQL as the database backend

**Rationale**: 
- User specified PostgreSQL as the database choice
- PostgreSQL provides robust ACID compliance and reliability
- Excellent support in drizzle-orm and auth.js ecosystems
- Production-ready with strong performance characteristics
- Supports complex queries and relationships for future scaling

**Alternatives considered**: 
- SQLite: Simpler but less suitable for production, limited concurrency
- MySQL: Similar capabilities but PostgreSQL has better JSON support and extensibility

**Implementation**: Connection string stored in `.env` file, accessed via `process.env.DATABASE_URL`

---

### ORM: drizzle-orm

**Decision**: Use drizzle-orm (latest stable version) for database operations

**Rationale**:
- Type-safe ORM with excellent TypeScript support
- Lightweight and performant
- Native PostgreSQL support with postgres.js driver
- Excellent migration tooling via drizzle-kit
- Strong integration with auth.js via @auth/drizzle-adapter

**Alternatives considered**:
- Prisma: More mature but heavier, requires separate schema file
- TypeORM: More features but more complex, less type-safe
- Raw SQL: Maximum control but no type safety, more error-prone

**Package Versions**:
- `drizzle-orm@latest` - Core ORM library
- `drizzle-kit@latest` - Migration and schema management (dev dependency)
- `postgres@latest` - PostgreSQL driver for Node.js

**Implementation Notes**:
- Use `drizzle-orm/postgres-js` for PostgreSQL connection
- Schema defined in `src/lib/db/schema.ts`
- Connection configured in `src/lib/db/index.ts`

---

### Authentication: Auth.js (NextAuth.js v5)

**Decision**: Use Auth.js (NextAuth.js) v5 with @auth/drizzle-adapter

**Rationale**:
- Industry-standard authentication solution for Next.js
- Built-in support for multiple providers (starting with credentials)
- Secure session management
- Excellent Next.js App Router integration
- Strong security practices (password hashing, CSRF protection)
- Active development and community support

**Alternatives considered**:
- Custom authentication: More control but requires implementing security best practices from scratch
- Clerk: Simpler but external dependency and potential vendor lock-in
- Supabase Auth: Good but requires Supabase infrastructure

**Package Versions**:
- `next-auth@latest` or `@auth/core@latest` - Core auth.js library
- `@auth/drizzle-adapter@latest` - Drizzle ORM adapter for auth.js

**Implementation Notes**:
- Configure in `src/lib/auth.ts` using Next.js App Router pattern
- Use Credentials provider for username/password authentication
- Session strategy: JWT (default) or database sessions
- Route handler at `src/app/api/auth/[...nextauth]/route.ts`

---

### Testing Framework

**Decision**: NEEDS CLARIFICATION - Research required for Next.js 15 compatible testing setup

**Research Tasks**:
1. Determine Jest vs Vitest compatibility with Next.js 15
2. Identify testing-library versions compatible with React 18.3.1
3. Research integration testing patterns for Next.js App Router
4. Determine E2E testing framework (Playwright vs Cypress)

**Rationale for Research**:
- Next.js 15 is relatively new, testing setup may have specific requirements
- App Router has different testing patterns than Pages Router
- Need to ensure compatibility with TypeScript 5.6.3

**Alternatives to evaluate**:
- Jest with @testing-library/react and @testing-library/jest-dom
- Vitest with similar testing libraries
- Playwright for E2E testing
- Supertest or similar for API route testing

---

## Best Practices & Patterns

### Password Security

**Decision**: Use bcrypt or Argon2 for password hashing (via auth.js)

**Rationale**:
- Auth.js handles password hashing automatically with secure algorithms
- Never store passwords in plain text
- Industry-standard hashing with salt

**Implementation**: 
- Auth.js Credentials provider handles password verification
- No manual hashing required in application code

---

### Database Schema Design

**Decision**: Use auth.js recommended schema structure via drizzle adapter

**Rationale**:
- Auth.js adapter provides schema definitions that match auth.js requirements
- Ensures compatibility with all auth.js features
- Reduces risk of schema mismatches

**Implementation**:
- Import schema from @auth/drizzle-adapter or define based on auth.js requirements
- Tables: users, accounts, sessions, verification_tokens (as needed)
- Use drizzle-kit to generate and apply migrations

---

### Environment Configuration

**Decision**: Store sensitive configuration in `.env` file

**Rationale**:
- Standard practice for Next.js applications
- Keeps secrets out of version control
- Easy to configure per environment

**Required Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Secret for JWT signing (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL (for production)

---

### Error Handling

**Decision**: Follow auth.js error patterns and provide user-friendly messages

**Rationale**:
- Auth.js provides standardized error handling
- Must prevent information disclosure (per spec FR-012)
- Generic error messages for security (don't reveal if username exists)

**Implementation**:
- Use auth.js error callbacks
- Log detailed errors server-side
- Return generic messages to clients

---

## Integration Points

### Next.js App Router Integration

**Pattern**: Use route handlers for auth.js API routes

**Implementation**:
- `src/app/api/auth/[...nextauth]/route.ts` - Catch-all route for auth.js
- Server components can access session via `auth()` helper
- Client components use `useSession()` hook

---

### Database Connection Management

**Pattern**: Singleton database connection instance

**Implementation**:
- Create single drizzle instance in `src/lib/db/index.ts`
- Reuse across application
- Handle connection pooling via postgres.js

---

## Remaining Research Items

1. **Testing Framework Selection**: Complete evaluation of Jest vs Vitest for Next.js 15
2. **Integration Test Patterns**: Research best practices for testing Next.js App Router API routes
3. **E2E Testing**: Determine if Playwright or Cypress is better for Next.js 15
4. **Session Strategy**: Evaluate JWT vs database sessions for this use case

---

## References

- [Auth.js Documentation](https://authjs.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [@auth/drizzle-adapter](https://authjs.dev/getting-started/adapters/drizzle)

