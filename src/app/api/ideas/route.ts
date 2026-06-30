import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listIdeas, createIdea } from "@/server/ideas";
import type { DriveCategory } from "@prisma/client";

type LinkInput = { url: string; label?: string; category?: DriveCategory | null };

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json(await listIdeas());
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const b = await req.json();
    if (!b.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
    const links: LinkInput[] = Array.isArray(b.links)
      ? b.links.filter((l: LinkInput) => l?.url?.trim())
      : [];
    const idea = await createIdea({
      title: b.title.trim(), notes: b.notes ?? "",
      createdById: user.id, links,
    });
    return NextResponse.json(idea, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
