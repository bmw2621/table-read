import { auth } from "@/lib/auth";
import { createTroupe, getUserTroupes } from "@/lib/troupes/service";
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

  // Get user's troupes
  const troupes = await getUserTroupes(userId);

  return NextResponse.json({
    troupes,
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

  const body = await request.json();
  const name = body.name;
  if (!name) {
    return NextResponse.json(
      { error: "Name is required", status: 400, ok: false },
      { status: 400 }
    );
  }
  try {
    const troupe = await createTroupe(session.user.id, name);
    return NextResponse.json(
      { troupe, status: 201, ok: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating troupe:", error);
    return NextResponse.json(
      {
        error: "InternalServerError",
        message: "Failed to create troupe",
        status: 500,
        ok: false,
      },
      { status: 500 }
    );
  }
}
