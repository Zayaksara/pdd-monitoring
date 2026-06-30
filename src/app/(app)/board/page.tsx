import { getCurrentUser } from "@/lib/auth";
import { listTasks } from "@/server/tasks";
import Board from "./_components/Board";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const user = await getCurrentUser();
  const tasks = await listTasks();
  return <Board initialTasks={tasks} currentUser={user!} />;
}
