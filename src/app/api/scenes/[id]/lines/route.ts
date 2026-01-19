import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createLine, getLinesByScene } from "@/lib/lines/service";
import { createLineSchema } from "@/lib/lines/validation";

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

  const { id: sceneId } = await params;

  try {
    const lines = await getLinesByScene(sceneId, session.user.id);
    return NextResponse.json({
      lines,
      status: 200,
      ok: true,
    });
  } catch (error: any) {
    if (error.message.includes("access")) {
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
        message: "Scene not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}

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

  const { id: sceneId } = await params;

  try {
    const body = await request.json();
    const validation = createLineSchema.safeParse({
      ...body,
      sceneId,
    });

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

    const line = await createLine(
      validation.data.text,
      sceneId,
      session.user.id,
      validation.data.characterId
    );

    return NextResponse.json({ line, status: 201, ok: true }, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("Character and scene")) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: error.message,
          status: 409,
          ok: false,
        },
        { status: 409 }
      );
    }
    if (error.message.includes("access")) {
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
    if (error.message.includes("not found")) {
      return NextResponse.json(
        {
          error: "NotFound",
          message: error.message,
          status: 404,
          ok: false,
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: "InternalServerError",
        message: "Failed to create line",
        status: 500,
        ok: false,
      },
      { status: 500 }
    );
  }
}

