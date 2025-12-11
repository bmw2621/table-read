import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignoutButton } from "@/components/auth/signout-button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Welcome back, {session.user?.name || session.user?.username}!
              </p>
            </div>
            <SignoutButton />
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                User Information
              </h2>
              <dl className="mt-4 space-y-2">
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500">Username:</dt>
                  <dd className="ml-4 text-sm text-gray-900">
                    {(session.user as any)?.username || session.user?.name}
                  </dd>
                </div>
                {session.user?.name && (
                  <div className="flex">
                    <dt className="text-sm font-medium text-gray-500">Name:</dt>
                    <dd className="ml-4 text-sm text-gray-900">
                      {session.user.name}
                    </dd>
                  </div>
                )}
                {session.user?.email && (
                  <div className="flex">
                    <dt className="text-sm font-medium text-gray-500">Email:</dt>
                    <dd className="ml-4 text-sm text-gray-900">
                      {session.user.email}
                    </dd>
                  </div>
                )}
                {session.user?.id && (
                  <div className="flex">
                    <dt className="text-sm font-medium text-gray-500">User ID:</dt>
                    <dd className="ml-4 text-sm text-gray-900 font-mono">
                      {session.user.id}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-md border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Protected Content
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                This is a protected route. Only authenticated users can access this
                page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

