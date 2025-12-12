import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateScriptSchema } from "@/lib/scripts/validation";
import { db } from "@/lib/db";
import { scripts, troupeMemberships } from "@/lib/db/schema";
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

  // Get script
  const [script] = await db
    .select()
    .from(scripts)
    .where(eq(scripts.id, id))
    .limit(1);

  if (!script) {
    return NextResponse.json(
      { error: "NotFound", message: "Script not found", status: 404, ok: false },
      { status: 404 }
    );
  }

  // Basic access check: user owns it OR script belongs to a troupe user is member of
  // Full access control will be in US3
  let hasAccess = false;
  if (script.userId === userId) {
    hasAccess = true;
  } else if (script.troupeId) {
    const membership = await db
      .select()
      .from(troupeMemberships)
      .where(
        and(
          eq(troupeMemberships.userId, userId),
          eq(troupeMemberships.troupeId, script.troupeId)
        )
      )
      .limit(1);
    hasAccess = membership.length > 0;
  }

  if (!hasAccess) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "You do not have access to this script",
        status: 403,
        ok: false,
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    script: {
      ...script,
      ownerType: script.userId ? "user" : "troupe",
      canEdit: script.userId === userId, // For US2: only owner can edit (troupe edit logic in US3)
    },
    status: 200,
    ok: true,
  });
}

export async function PUT(
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

  try {
    const body = await request.json();
    const validation = updateScriptSchema.safeParse(body);

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

    // Get script
    const [script] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, id))
      .limit(1);

    if (!script) {
      return NextResponse.json(
        { error: "NotFound", message: "Script not found", status: 404, ok: false },
        { status: 404 }
      );
    }

    // Check ownership (for US2: only owner can update)
    if (script.userId !== userId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only the owner can update this script",
          status: 403,
          ok: false,
        },
        { status: 403 }
      );
    }

    // Update script
    const [updatedScript] = await db
      .update(scripts)
      .set({
        title: validation.data.title,
        updatedAt: new Date(),
      })
      .where(eq(scripts.id, id))
      .returning();

    return NextResponse.json({
      script: updatedScript,
      status: 200,
      ok: true,
    });
  } catch (error: any) {
    console.error("Error updating script:", error);
    return NextResponse.json(
      {
        error: "InternalServerError",
        message: "Failed to update script",
        status: 500,
        ok: false,
      },
      { status: 500 }
    );
  }
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
  const userId = session.user.id;

  try {
    // Get script
    const [script] = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, id))
      .limit(1);

    if (!script) {
      return NextResponse.json(
        { error: "NotFound", message: "Script not found", status: 404, ok: false },
        { status: 404 }
      );
    }

    // Check ownership (for US2: only owner can delete)
    if (script.userId !== userId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only the owner can delete this script",
          status: 403,
          ok: false,
        },
        { status: 403 }
      );
    }

    // Delete script
    await db.delete(scripts).where(eq(scripts.id, id));

    return NextResponse.json({
      message: "Script deleted successfully",
      status: 200,
      ok: true,
    });
  } catch (error: any) {
    console.error("Error deleting script:", error);
    return NextResponse.json(
      {
        error: "InternalServerError",
        message: "Failed to delete script",
        status: 500,
        ok: false,
      },
      { status: 500 }
    );
  }
}
