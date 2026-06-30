import { prisma } from "@/lib/db";
import type { TaskStatus } from "@prisma/client";

const include = {
  assignee: { select: { id: true, name: true, username: true } },
  ideas: { include: { idea: { include: { links: true } } } },
} as const;

export type TaskWithRelations = Awaited<ReturnType<typeof listTasks>>[number];

export function listTasks() {
  return prisma.task.findMany({ include, orderBy: { createdAt: "asc" } });
}
export function getTask(id: string) {
  return prisma.task.findUnique({ where: { id }, select: { id: true, assigneeId: true, status: true } });
}
export function createTask(input: {
  title: string; description?: string; assigneeId?: string | null; deadline?: Date | null; createdById: string;
}) {
  return prisma.task.create({ data: {
    title: input.title, description: input.description ?? "",
    assigneeId: input.assigneeId ?? null, deadline: input.deadline ?? null,
    createdById: input.createdById,
  } });
}
export function updateTaskFields(id: string, input: {
  title?: string; description?: string; assigneeId?: string | null; deadline?: Date | null;
}) {
  return prisma.task.update({ where: { id }, data: input });
}
export function updateTaskStatus(id: string, status: TaskStatus) {
  return prisma.task.update({ where: { id }, data: { status } });
}
export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
}
