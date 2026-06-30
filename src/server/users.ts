import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true },
    orderBy: { name: "asc" },
  });
}

export type UserListItem = Awaited<ReturnType<typeof listUsers>>[number];

export async function createUser(input: {
  username: string;
  name: string;
  role: "admin" | "user";
  password: string;
}) {
  return prisma.user.create({
    data: {
      username: input.username,
      name: input.name,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
    select: { id: true, username: true, name: true, role: true },
  });
}

export async function updateUser(
  id: string,
  input: { name?: string; role?: "admin" | "user"; password?: string }
) {
  return prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      role: input.role,
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
    },
    select: { id: true, username: true, name: true, role: true },
  });
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
}

export function countAdmins() {
  return prisma.user.count({ where: { role: "admin" } });
}

export function getUserRole(id: string) {
  return prisma.user.findUnique({ where: { id }, select: { role: true } });
}
