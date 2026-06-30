import { getCurrentUser } from "@/lib/auth";
import { listIdeas } from "@/server/ideas";
import { canPromoteIdea, type Role } from "@/lib/authz";
import IdeaList from "./_components/IdeaList";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const user = await getCurrentUser();
  const ideas = await listIdeas();
  const canPromote = user ? canPromoteIdea(user.role as Role) : false;
  return <IdeaList initialIdeas={ideas} canPromote={canPromote} />;
}
