import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignoutButton } from "@/components/auth/signout-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="rounded-md border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Protected Content
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This is a protected route. Only authenticated users can access
              this page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
