import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { updateUser, deleteUser, countAdmins, getUserRole } from "@/server/users";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const b = await req.json();

    const input: { name?: string; role?: "admin" | "user"; password?: string } = {};
    if (typeof b.name === "string" && b.name.trim()) input.name = b.name.trim();
    if (b.role === "admin" || b.role === "user") input.role = b.role;
    if (typeof b.password === "string" && b.password) input.password = b.password;

    // Block demoting the last remaining admin to "user".
    if (input.role === "user") {
      const current = await getUserRole(id);
      if (current?.role === "admin" && (await countAdmins()) <= 1) {
        return NextResponse.json({ error: "Minimal satu admin." }, { status: 400 });
      }
    }

    const user = await updateUser(id, input);
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Block deleting the last remaining admin.
    const current = await getUserRole(id);
    if (current?.role === "admin" && (await countAdmins()) <= 1) {
      return NextResponse.json({ error: "Minimal satu admin." }, { status: 400 });
    }

    await deleteUser(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
