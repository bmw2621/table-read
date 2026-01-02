import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { troupeMemberships, troupes } from "@/lib/db/schema";
import { createTroupe } from "@/lib/troupes/service";
import { eq } from "drizzle-orm";
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
  const userTroupes = await db
    .select({
      troupe: troupes,
    })
    .from(troupes)
    .innerJoin(troupeMemberships, eq(troupeMemberships.troupeId, troupes.id))
    .where(eq(troupeMemberships.userId, userId));

  // Get member counts for each troupe
  const troupesWithCounts = await Promise.all(
    userTroupes.map(async (item) => {
      const members = await db
        .select()
        .from(troupeMemberships)
        .where(eq(troupeMemberships.troupeId, item.troupe.id));

      return {
        ...item.troupe,
        isDirector: item.troupe.directorId === userId,
        memberCount: members.length,
      };
    })
  );

  return NextResponse.json({
    troupes: troupesWithCounts,
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
