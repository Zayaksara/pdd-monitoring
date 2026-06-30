import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createTask } from "@/server/tasks";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const b = await req.json();
    if (!b.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
    const task = await createTask({
      title: b.title.trim(), description: b.description ?? "",
      assigneeId: b.assigneeId || null,
      deadline: b.deadline ? new Date(b.deadline) : null,
      createdById: admin.id,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
