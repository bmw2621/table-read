import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signinSchema } from "@/lib/auth/validation";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate credentials with zod
        const validationResult = signinSchema.safeParse({
          username: credentials?.username,
          password: credentials?.password,
        });

        if (!validationResult.success) {
          // Generic error - don't reveal validation details (per FR-012)
          return null;
        }

        const { username, password } = validationResult.data;

        const userResults = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (userResults.length === 0) {
          // Generic error - don't reveal if username exists (per FR-012)
          return null;
        }

        const user = userResults[0];

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          // Generic error - don't reveal if password is wrong (per FR-012)
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
      }
      return session;
    },
  },
});

