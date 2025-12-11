import { z } from "zod";

/**
 * Username validation schema
 * Per spec requirements:
 * - Minimum 3 characters
 * - Maximum 30 characters
 * - Alphanumeric + underscore/hyphen only
 */
export const usernameSchema = z
  .string()
  .min(1, "Username is required")
  .min(3, "Username must be at least 3 characters long")
  .max(30, "Username must be no more than 30 characters long")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens"
  )
  .trim();

/**
 * Password validation schema
 * Per FR-003: Password must meet security requirements
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^a-zA-Z0-9]/,
    "Password must contain at least one special character"
  );

/**
 * Signup request validation schema
 */
export const signupSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

/**
 * Signin request validation schema
 */
export const signinSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Type exports
 */
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
