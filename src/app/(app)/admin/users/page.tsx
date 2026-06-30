import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/server/users";
import UserTable from "./_components/UserTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  if (me?.role !== "admin") redirect("/board");

  const users = await listUsers();
  return <UserTable initialUsers={users} currentUserId={me.id} />;
}
