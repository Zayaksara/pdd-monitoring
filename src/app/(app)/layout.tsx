import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, Lightbulb, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./_components/LogoutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roleBadgeClass =
    user.role === "admin"
      ? "bg-[--primary] text-[--on-primary]"
      : "bg-[--muted] text-[--muted-fg]";
  const roleLabel = user.role === "admin" ? "Admin" : "Anggota";

  return (
    <div className="min-h-dvh flex flex-col bg-[--bg]">
      {/* Top nav */}
      <header className="bg-surface border-b border-[--border] sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Brand */}
            <Link
              href="/board"
              className="font-heading font-semibold text-lg text-[--fg] hover:text-primary shrink-0 focus:outline-none focus:ring-2 focus:ring-[--primary] rounded"
            >
              Monitoring PDD
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-1 flex-1">
              <Link
                href="/board"
                className="flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium text-[--fg] hover:text-primary hover:bg-[--muted] focus:outline-none focus:ring-2 focus:ring-[--primary] transition-colors"
              >
                <LayoutGrid size={16} />
                <span className="hidden sm:inline">Papan</span>
              </Link>
              <Link
                href="/ideas"
                className="flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium text-[--fg] hover:text-primary hover:bg-[--muted] focus:outline-none focus:ring-2 focus:ring-[--primary] transition-colors"
              >
                <Lightbulb size={16} />
                <span className="hidden sm:inline">Ide</span>
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin/users"
                  className="flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium text-[--fg] hover:text-primary hover:bg-[--muted] focus:outline-none focus:ring-2 focus:ring-[--primary] transition-colors"
                >
                  <Users size={16} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
            </nav>

            {/* User info + logout */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-[--fg] truncate max-w-[120px] hidden xs:block">
                  {user.name}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadgeClass}`}
                >
                  {roleLabel}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-5xl w-full p-4 flex-1">
        {children}
      </main>
    </div>
  );
}
