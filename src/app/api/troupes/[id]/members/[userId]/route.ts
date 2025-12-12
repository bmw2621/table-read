import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { removeMember } from "@/lib/troupes/service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", status: 401, ok: false },
      { status: 401 }
    );
  }

  const { id, userId } = await params;

  try {
    await removeMember(id, userId, session.user.id);
    return NextResponse.json({
      message: "Member removed successfully",
      status: 200,
      ok: true,
    });
  } catch (error: any) {
    if (error.message.includes("director") || error.message.includes("remove")) {
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
        message: "Troupe or membership not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}

