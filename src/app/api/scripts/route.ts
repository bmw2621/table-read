import { auth } from "@/lib/auth";
import { createScript, getUserScripts } from "@/lib/scripts/service";
import { createScriptSchema } from "@/lib/scripts/validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Get user's troupe IDs
  const formattedScripts = await getUserScripts(userId);

  return NextResponse.json({
    scripts: formattedScripts,
    pagination: {
      total: formattedScripts.length,
      limit: 100,
      offset: 0,
      hasMore: false,
    },
    status: 200,
    ok: true,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = createScriptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "ValidationError",
          message: validation.error.errors[0].message,
          status: 400,
          ok: false,
        },
        { status: 400 }
      );
    }

    const script = await createScript({
      title: validation.data.title,
      userId: session.user.id,
      troupeId: validation.data.troupeId,
    });

    return NextResponse.json(
      { script, status: 201, ok: true },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating script:", error);

    if (error.message.includes("member")) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: error.message,
          status: 403,
          ok: false,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: "InternalServerError",
        message: "Failed to create script",
        status: 500,
        ok: false,
      },
      { status: 500 }
    );
  }
}
