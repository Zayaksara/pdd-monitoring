"use client";

import { LogOut } from "lucide-react";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium text-[--muted-fg] hover:text-[--fg] hover:bg-[--muted] focus:outline-none focus:ring-2 focus:ring-[--primary] transition-colors"
      aria-label="Keluar"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">Keluar</span>
    </button>
  );
}
