import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import { getUserScripts } from "@/lib/scripts/service";
import { getUserTroupes } from "@/lib/troupes/service";
import { getQueryClient } from "@/lib/utils/getQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import UserScripts from "./_components/UserScripts";
import UserTroupes from "./_components/UserTroupes";
import { scriptOptions, troupeOptions } from "./queriesMutations";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/signin");
  }

  const [scripts, troupes] = await Promise.all([
    getUserScripts(session.user.id),
    getUserTroupes(session.user.id),
  ]);

  const queryClient = getQueryClient();

  queryClient.setQueryData(scriptOptions.queryKey, scripts);
  queryClient.setQueryData(troupeOptions.queryKey, troupes);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserTroupes />
      <UserScripts />
    </HydrationBoundary>
  );
}
