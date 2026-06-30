import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { listUsers, createUser } from "@/server/users";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await listUsers());
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const b = await req.json();
    const username = typeof b.username === "string" ? b.username.trim() : "";
    const name = typeof b.name === "string" ? b.name.trim() : "";
    const password = typeof b.password === "string" ? b.password : "";
    const role = b.role === "admin" ? "admin" : "user";
    if (!username || !password) {
      return NextResponse.json({ error: "Username dan kata sandi wajib diisi." }, { status: 400 });
    }
    const user = await createUser({ username, name: name || username, role, password });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    }
    throw e;
  }
}
