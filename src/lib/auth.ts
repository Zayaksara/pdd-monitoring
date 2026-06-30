import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, name: true, role: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Response("Forbidden", { status: 403 });
  return user;
}
