import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    name: text("name"),
    username: text("username").notNull().unique(),
    email: text("email"),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    password: text("password").notNull(), // Hashed by auth.js
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("username_idx").on(table.username),
  })
);

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("session_userId_idx").on(table.userId),
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
    expiresAtIdx: index("session_expiresAt_idx").on(table.expiresAt),
  })
);

export const accounts = pgTable(
  "account",
  {
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
  },
  (table) => ({
    userIdIdx: index("account_userId_idx").on(table.userId),
    providerAccountIdx: uniqueIndex("account_provider_providerAccountId_idx").on(
      table.provider,
      table.providerAccountId
    ),
  })
);

export const verificationTokens = pgTable("verification_token", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

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

export const scripts = pgTable(
  "script",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    title: text("title").notNull(),
    // Polymorphic ownership: script belongs to EITHER user OR troupe (mutually exclusive)
    // Cascade behavior: Only deletes script if it belongs to the deleted entity
    // - User-owned (userId set, troupeId null): Deleted when user deleted
    // - Troupe-owned (userId null, troupeId set): Deleted when troupe deleted, NOT when user deleted
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

