import { NextRequest, NextResponse } from "next/server";

// Stub implementation - will be implemented based on tests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

