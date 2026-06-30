import { prisma } from "@/lib/db";

export function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true },
    orderBy: { name: "asc" },
  });
}

export type UserListItem = Awaited<ReturnType<typeof listUsers>>[number];
