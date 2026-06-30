import { listIdeas } from "@/server/ideas";
import IdeaList from "./_components/IdeaList";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const ideas = await listIdeas();
  return <IdeaList initialIdeas={ideas} />;
}
