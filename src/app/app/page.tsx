import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScriptsList from "./ScriptsList";
import { getUserScripts } from "@/lib/scripts/service";

import AddScriptButton from "./AddScriptButton";
import { getQueryClient } from "@/lib/utils/getQueryClient";
import { scriptOptions } from "./queriesMutations";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const scripts = await getUserScripts(session.user.id);
  const queryClient = getQueryClient();

  queryClient.setQueryData(scriptOptions.queryKey, scripts);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="min-h-screen mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Scripts</h2>
                <AddScriptButton />
              </div>
              <ScriptsList />
            </div>
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
}
