"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signupSchema as baseSignupSchema } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

function getPasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong" | "very-strong";
  score: number;
  label: string;
} {
  if (!password) {
    return { strength: "weak", score: 0, label: "" };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length >= 16) score++;

  if (score <= 2) {
    return { strength: "weak", score, label: "Weak" };
  } else if (score <= 4) {
    return { strength: "medium", score, label: "Medium" };
  } else if (score <= 6) {
    return { strength: "strong", score, label: "Strong" };
  } else {
    return { strength: "very-strong", score, label: "Very Strong" };
  }
}

// Extend base schema with confirmPassword and refine
const signupSchema = baseSignupSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const password = useWatch({ control, name: "password" });
  const passwordStrength = getPasswordStrength(password || "");

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          name: data.name || undefined,
          email: data.email || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to create account");
        return;
      }

      // Redirect to sign in page after successful registration
      router.push("/signin?registered=true");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700"
        >
          Username
        </label>
        <input
          {...register("username")}
          type="text"
          id="username"
          className={cn(
            "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500",
            errors.username && "border-red-300"
          )}
          disabled={isLoading}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          {...register("password")}
          type="password"
          id="password"
          className={cn(
            "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500",
            errors.password && "border-red-300"
          )}
          disabled={isLoading}
        />
        {password && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    passwordStrength.strength === "weak" && "bg-red-500 w-1/4",
                    passwordStrength.strength === "medium" &&
                      "bg-yellow-500 w-2/4",
                    passwordStrength.strength === "strong" &&
                      "bg-blue-500 w-3/4",
                    passwordStrength.strength === "very-strong" &&
                      "bg-green-500 w-full"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  passwordStrength.strength === "weak" && "text-red-600",
                  passwordStrength.strength === "medium" && "text-yellow-600",
                  passwordStrength.strength === "strong" && "text-blue-600",
                  passwordStrength.strength === "very-strong" && "text-green-600"
                )}
              >
                {passwordStrength.label}
              </span>
            </div>
          </div>
        )}
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700"
        >
          Confirm Password
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          id="confirmPassword"
          className={cn(
            "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500",
            errors.confirmPassword && "border-red-300"
          )}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          {...register("name")}
          type="text"
          id="name"
          className={cn(
            "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500",
            errors.name && "border-red-300"
          )}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          className={cn(
            "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500",
            errors.email && "border-red-300"
          )}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}

