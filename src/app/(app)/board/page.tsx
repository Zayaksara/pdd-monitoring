import { getCurrentUser } from "@/lib/auth";
import { listTasks } from "@/server/tasks";
import { listUsers } from "@/server/users";
import Board from "./_components/Board";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const user = await getCurrentUser();
  const tasks = await listTasks();
  const users = await listUsers();
  return <Board initialTasks={tasks} currentUser={user!} users={users} />;
}
