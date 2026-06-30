import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { updateIdea, deleteIdea } from "@/server/ideas";
import type { DriveCategory } from "@prisma/client";

type LinkInput = { url: string; label?: string; category?: DriveCategory | null };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const b = await req.json();
    const links: LinkInput[] | undefined = Array.isArray(b.links)
      ? b.links.filter((l: LinkInput) => l?.url?.trim())
      : undefined;
    const updated = await updateIdea(id, {
      title: b.title, notes: b.notes, links,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    await deleteIdea(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
