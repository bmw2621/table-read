import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteTroupe } from "@/lib/troupes/service";
import { db } from "@/lib/db";
import { troupes, troupeMemberships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const { id } = await params;
  const userId = session.user.id;

  const [troupe] = await db
    .select()
    .from(troupes)
    .where(eq(troupes.id, id))
    .limit(1);

  if (!troupe) {
    return NextResponse.json(
      { error: "NotFound", message: "Troupe not found", status: 404, ok: false },
      { status: 404 }
    );
  }

  // Check membership
  const membership = await db
    .select()
    .from(troupeMemberships)
    .where(
      and(
        eq(troupeMemberships.userId, userId),
        eq(troupeMemberships.troupeId, id)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "You are not a member of this troupe",
        status: 403,
        ok: false,
      },
      { status: 403 }
    );
  }

  const members = await db
    .select()
    .from(troupeMemberships)
    .where(eq(troupeMemberships.troupeId, id));

  return NextResponse.json({
    troupe: {
      ...troupe,
      isDirector: troupe.directorId === userId,
      members,
    },
    status: 200,
    ok: true,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    await deleteTroupe(id, session.user.id);
    return NextResponse.json({
      message: "Troupe deleted successfully",
      status: 200,
      ok: true,
    });
  } catch (error: any) {
    if (error.message.includes("director")) {
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
        error: "NotFound",
        message: "Troupe not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}

