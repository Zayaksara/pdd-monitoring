import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { attachIdea, detachIdea } from "@/server/tasks";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const { ideaId } = await req.json();
    if (typeof ideaId !== "string" || !ideaId) {
      return NextResponse.json({ error: "ideaId required" }, { status: 400 });
    }
    return NextResponse.json(await attachIdea(id, ideaId), { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const { ideaId } = await req.json();
    if (typeof ideaId !== "string" || !ideaId) {
      return NextResponse.json({ error: "ideaId required" }, { status: 400 });
    }
    await detachIdea(id, ideaId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
