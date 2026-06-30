"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { X } from "lucide-react";
import type { UserListItem } from "@/server/users";

interface UserDialogProps {
  mode: "create" | "edit";
  user?: UserListItem;
  onClose: () => void;
  onSaved: (saved: UserListItem) => void;
}

export default function UserDialog({ mode, user, onClose, onSaved }: UserDialogProps) {
  const [username, setUsername] = useState(user?.username ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState<"admin" | "user">(user?.role ?? "user");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const usernameId = useId();
  const nameId = useId();
  const roleId = useId();
  const passwordId = useId();
  const headingId = useId();

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [submitting, onClose]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    firstInputRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const enabled = Array.from(focusable).filter((el) => !el.hasAttribute("disabled"));
      if (enabled.length === 0) return;
      const first = enabled[0];
      const last = enabled[enabled.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (mode === "create" && (!trimmedUsername || !password)) {
      setError("Username dan kata sandi wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const url = mode === "create" ? "/api/users" : `/api/users/${user!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const payload =
      mode === "create"
        ? { username: trimmedUsername, name: trimmedName, role, password }
        : {
            name: trimmedName,
            role,
            ...(password ? { password } : {}),
          };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = mode === "create" ? "Gagal membuat akun." : "Gagal menyimpan perubahan.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore non-JSON bodies
        }
        setError(msg);
        setSubmitting(false);
        return;
      }
      const saved = (await res.json()) as UserListItem;
      onSaved(saved);
    } catch {
      setError(mode === "create" ? "Gagal membuat akun." : "Gagal menyimpan perubahan.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="w-full max-w-md rounded-2xl bg-[--surface] shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[--border] px-5 py-4">
          <h2 id={headingId} className="text-base font-heading font-semibold text-[--fg]">
            {mode === "create" ? "Tambah Akun" : "Ubah Akun"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="shrink-0 rounded-lg p-1 text-[--muted-fg] hover:text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {mode === "create" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={usernameId} className="text-sm font-medium text-[--fg]">
                Username
              </label>
              <input
                id={usernameId}
                ref={firstInputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm font-mono text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[--fg]">Username</span>
              <p className="rounded-lg bg-[--muted] px-3 py-2 text-sm font-mono text-[--muted-fg]">
                {user?.username}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor={nameId} className="text-sm font-medium text-[--fg]">
              Nama
            </label>
            <input
              id={nameId}
              ref={mode === "edit" ? firstInputRef : undefined}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={roleId} className="text-sm font-medium text-[--fg]">
              Peran
            </label>
            <select
              id={roleId}
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "user")}
              className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            >
              <option value="user">Anggota</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={passwordId} className="text-sm font-medium text-[--fg]">
              Kata Sandi
            </label>
            <input
              id={passwordId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={mode === "create"}
              autoComplete="new-password"
              placeholder={mode === "edit" ? "Biarkan kosong untuk tetap" : undefined}
              className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="min-h-[40px] rounded-lg border border-[--border] bg-white px-4 text-sm font-semibold text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[40px] rounded-lg bg-[--primary] px-4 text-sm font-semibold text-[--on-primary] hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
            >
              {submitting ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
