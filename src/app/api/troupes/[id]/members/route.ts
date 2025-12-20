import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveMember } from "@/lib/troupes/service";
import { approveMemberSchema } from "@/lib/troupes/validation";

export async function POST(
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
  const body = await request.json();
  const validation = approveMemberSchema.safeParse(body);

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

  try {
    const membership = await approveMember(id, validation.data.userId, session.user.id);
    return NextResponse.json(
      { membership, status: 201, ok: true },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes("director") || error.message.includes("approve")) {
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
    if (error.message.includes("already a member")) {
      return NextResponse.json(
        {
          error: "DuplicateMembership",
          message: error.message,
          status: 400,
          ok: false,
        },
        { status: 400 }
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

