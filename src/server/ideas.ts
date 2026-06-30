import { prisma } from "@/lib/db";
import type { DriveCategory } from "@prisma/client";

type LinkInput = { url: string; label?: string; category?: DriveCategory | null };

const include = {
  links: true,
  createdBy: { select: { id: true, name: true } },
  tasks: { include: { task: { select: { id: true, title: true } } } },
} as const;

export function listIdeas() {
  return prisma.idea.findMany({ include, orderBy: { createdAt: "desc" } });
}
export function createIdea(input: { title: string; notes?: string; createdById: string; links: LinkInput[] }) {
  return prisma.idea.create({ data: {
    title: input.title, notes: input.notes ?? "", createdById: input.createdById,
    links: { create: input.links.map(l => ({ url: l.url, label: l.label ?? "", category: l.category ?? null })) },
  }, include });
}
export async function updateIdea(id: string, input: { title?: string; notes?: string; links?: LinkInput[] }) {
  if (input.links) {
    await prisma.ideaLink.deleteMany({ where: { ideaId: id } });
  }
  return prisma.idea.update({ where: { id }, data: {
    title: input.title, notes: input.notes,
    ...(input.links ? { links: { create: input.links.map(l => ({ url: l.url, label: l.label ?? "", category: l.category ?? null })) } } : {}),
  }, include });
}
export async function deleteIdea(id: string) { await prisma.idea.delete({ where: { id } }); }
