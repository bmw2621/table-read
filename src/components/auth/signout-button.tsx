"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      router.push("/signin");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {isLoading ? "Signing out..." : "Sign Out"}
    </button>
  );
}

