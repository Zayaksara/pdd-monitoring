import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

// a constant-time decoy so a missing user still costs one bcrypt compare
const DUMMY_HASH = bcrypt.hashSync("unused-decoy-password", 10);

export async function POST(req: NextRequest) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { username, password } = body;
  if (!username || !password) return NextResponse.json({ error: "missing" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { username: username as string } });
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const ok = await verifyPassword(password as string, hash);
  if (!user || !ok) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }
  const token = await createSessionToken({ sub: user.id, role: user.role });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
