"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import type { UserListItem } from "@/server/users";
import UserDialog from "./UserDialog";

interface UserTableProps {
  initialUsers: UserListItem[];
  currentUserId: string;
}

function RoleBadge({ role }: { role: "admin" | "user" }) {
  const cls =
    role === "admin"
      ? "bg-[--primary] text-[--on-primary]"
      : "bg-[--muted] text-[--muted-fg]";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {role === "admin" ? "Admin" : "Anggota"}
    </span>
  );
}

export default function UserTable({ initialUsers, currentUserId }: UserTableProps) {
  const [users, setUsers] = useState<UserListItem[]>(initialUsers);
  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; user: UserListItem } | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSaved(saved: UserListItem) {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === saved.id);
      const next = exists
        ? prev.map((u) => (u.id === saved.id ? saved : u))
        : [...prev, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setDialog(null);
  }

  async function handleDelete(user: UserListItem) {
    if (
      !window.confirm(`Hapus akun "${user.name}" (${user.username})? Tindakan ini permanen.`)
    ) {
      return;
    }
    setDeletingId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        let msg = "Gagal menghapus akun.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore non-JSON bodies
        }
        setError(msg);
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      setError("Gagal menghapus akun.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-heading font-semibold text-[--fg]">Kelola Akun</h1>
        <button
          type="button"
          onClick={() => setDialog({ mode: "create" })}
          className="flex items-center gap-1.5 min-h-[40px] rounded-lg bg-[--primary] px-4 text-sm font-semibold text-[--on-primary] hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-[--primary]"
        >
          <Plus size={16} />
          <span>Tambah Akun</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[--border] bg-[--surface] px-4 py-10 text-center">
          <UserPlus size={28} className="text-[--muted-fg]" />
          <p className="text-sm text-[--muted-fg]">Belum ada akun.</p>
          <button
            type="button"
            onClick={() => setDialog({ mode: "create" })}
            className="flex items-center gap-1.5 min-h-[40px] rounded-lg bg-[--primary] px-4 text-sm font-semibold text-[--on-primary] hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-[--primary]"
          >
            <Plus size={16} />
            <span>Tambah Akun</span>
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[--border] bg-[--surface] p-4 shadow-sm"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-[--fg]">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-[--muted-fg]">(Anda)</span>
                  )}
                </span>
                <span className="truncate font-mono text-xs text-[--muted-fg]">
                  {u.username}
                </span>
              </div>
              <RoleBadge role={u.role} />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "edit", user: u })}
                  className="flex items-center gap-1.5 min-h-[40px] rounded-lg border border-[--border] bg-white px-3 text-sm font-semibold text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
                >
                  <Pencil size={15} />
                  <span className="hidden sm:inline">Ubah</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(u)}
                  disabled={deletingId === u.id}
                  className="flex items-center gap-1.5 min-h-[40px] rounded-lg border border-[--destructive] bg-white px-3 text-sm font-semibold text-[--destructive] hover:bg-[--destructive] hover:text-[--on-destructive] focus:outline-none focus:ring-2 focus:ring-[--destructive] disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  <span className="hidden sm:inline">
                    {deletingId === u.id ? "Menghapus…" : "Hapus"}
                  </span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialog && (
        <UserDialog
          mode={dialog.mode}
          user={dialog.mode === "edit" ? dialog.user : undefined}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
