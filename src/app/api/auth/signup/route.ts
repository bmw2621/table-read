import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/auth/validation";
import { logger } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with zod
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const allErrors = validationResult.error.errors.map((e) => e.message);

      // Determine error type based on field
      const errorType =
        firstError.path[0] === "password" ? "WeakPassword" : "ValidationError";

      return NextResponse.json(
        {
          error: errorType,
          message: firstError.message,
          errors: allErrors,
        },
        { status: 400 }
      );
    }

    const { username, password, name, email } = validationResult.data;

    // Check if username exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      logger.warn("Registration attempt with existing username", { username });
      return NextResponse.json(
        {
          error: "UsernameTaken",
          message: "Username is already taken",
        },
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
        name,
        email,
      })
      .returning();

    logger.info("User registered successfully", {
      userId: newUser.id,
      username: newUser.username,
    });

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
        status: 201,
        ok: true,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Signup error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "InternalServerError", message: "Internal server error" },
      { status: 500 }
    );
  }
}

