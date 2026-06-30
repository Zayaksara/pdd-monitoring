import { getCurrentUser } from "@/lib/auth";
import { listTasks } from "@/server/tasks";
import { listIdeas } from "@/server/ideas";
import { listUsers } from "@/server/users";
import Board from "./_components/Board";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const user = await getCurrentUser();
  const tasks = await listTasks();
  const ideas = await listIdeas();
  const users = await listUsers();
  return <Board initialTasks={tasks} currentUser={user!} users={users} ideas={ideas} />;
}
