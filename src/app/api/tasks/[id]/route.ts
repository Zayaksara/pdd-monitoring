import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getTask, updateTaskFields, updateTaskStatus, deleteTask } from "@/server/tasks";
import { canChangeStatus } from "@/lib/authz";
import type { Role, TaskStatus } from "@/lib/authz";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    const body = await req.json();
    const task = await getTask(id);
    if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (typeof body.status === "string") {
      const allowedStatuses: TaskStatus[] = ["PLANNING", "IN_PROGRESS", "REVIEW", "DONE"];
      if (!allowedStatuses.includes(body.status as TaskStatus)) {
        return NextResponse.json({ error: "invalid status" }, { status: 400 });
      }
      const allowed = canChangeStatus({
        role: user.role as Role,
        isAssignee: task.assigneeId === user.id,
        from: task.status as TaskStatus,
        to: body.status as TaskStatus,
      });
      if (!allowed) return new NextResponse("Forbidden", { status: 403 });
      return NextResponse.json(await updateTaskStatus(id, body.status));
    }
    await requireAdmin();
    const updated = await updateTaskFields(id, {
      title: body.title, description: body.description,
      assigneeId: body.assigneeId === undefined ? undefined : (body.assigneeId || null),
      deadline: body.deadline === undefined ? undefined : body.deadline ? new Date(body.deadline) : null,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteTask(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
