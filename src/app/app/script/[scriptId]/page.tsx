import { auth } from "@/lib/auth";
import { canAccessScript } from "@/lib/scripts/access";
import { getScript } from "@/lib/scripts/service";
import { redirect } from "next/navigation";
import { FC } from "react";

type Props = {
  params: Promise<{
    scriptId: string;
  }>;
};

const ScriptPage: FC<Props> = async ({ params }) => {
  const [session, { scriptId }] = await Promise.all([auth(), params]);

  if (!session?.user?.id) {
    return redirect("/signin");
  }

  const script = await getScript(scriptId);
  if (!script) {
    return redirect("/404");
  }
  const hasAccess = await canAccessScript(session.user.id, script);
  if (!hasAccess) {
    return redirect("/403");
  }
  return (
    <>
      <h1 className="text-2xl font-bold text-primary">Script Page</h1>
      <p className="text-sm text-gray-500">Script ID: {scriptId}</p>
      <pre>{JSON.stringify(script, null, 2)}</pre>
    </>
  );
};

export default ScriptPage;
