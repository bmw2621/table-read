import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createCharacter,
  getCharactersByScript,
} from "@/lib/characters/service";

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

  const { id: scriptId } = await params;

  try {
    const characters = await getCharactersByScript(scriptId, session.user.id);
    return NextResponse.json({
      characters,
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
        message: "Script not found",
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

  const { id: scriptId } = await params;

  try {
    const character = await createCharacter(scriptId, session.user.id);
    return NextResponse.json({ character, status: 201, ok: true }, { status: 201 });
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
        message: "Script not found",
        status: 404,
        ok: false,
      },
      { status: 404 }
    );
  }
}

