import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { canPromoteIdea } from "@/lib/authz";
import type { Role } from "@/lib/authz";
import { promoteIdeaToTask } from "@/server/ideas";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!canPromoteIdea(admin.role as Role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    const { id } = await params;
    try {
      const task = await promoteIdeaToTask(id, admin.id);
      return NextResponse.json(task, { status: 201 });
    } catch (e) {
      if (e instanceof Error && e.message === "idea not found") {
        return NextResponse.json({ error: "not found" }, { status: 404 });
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
