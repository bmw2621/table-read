import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateScriptSchema } from "@/lib/scripts/validation";
import { canAccessScript } from "@/lib/scripts/access";
import { isDirector } from "@/lib/troupes/permissions";
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

  // Check access using access control utility
  const hasAccess = await canAccessScript(userId, script);

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
      canEdit: script.userId === userId || (script.troupeId !== null && hasAccess), // Owner or troupe member can edit
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

    // Check access: user owns it OR is a member of troupe that owns it
    const hasAccess = await canAccessScript(userId, script);
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

    // Check deletion permission:
    // - User-owned scripts: only the owner can delete
    // - Troupe-owned scripts: only the troupe director can delete
    if (script.userId) {
      // User-owned script: check if user is the owner
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
    } else if (script.troupeId) {
      // Troupe-owned script: check if user is the director
      const isUserDirector = await isDirector(userId, script.troupeId);
      if (!isUserDirector) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Only the troupe director can delete this script",
            status: 403,
            ok: false,
          },
          { status: 403 }
        );
      }
    } else {
      // Script has no owner (edge case)
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
