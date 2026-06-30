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
import type { TaskWithRelations } from "@/server/tasks";
import type { UserListItem } from "@/server/users";

interface TaskDialogProps {
  mode: "create" | "edit";
  task?: TaskWithRelations;
  users: UserListItem[];
  onClose: () => void;
  onSaved: (saved: { task: SavedTask; assigneeId: string | null }) => void;
}

// The bare task row returned by POST/PATCH (no relations).
interface SavedTask {
  id: string;
  title: string;
  description: string;
  status: string;
  assigneeId: string | null;
  deadline: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TaskDialog({
  mode,
  task,
  users,
  onClose,
  onSaved,
}: TaskDialogProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [deadline, setDeadline] = useState(toDateInputValue(task?.deadline));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const descId = useId();
  const assigneeFieldId = useId();
  const deadlineId = useId();
  const headingId = useId();

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [submitting, onClose]);

  // Focus management: store previous focus, focus first field, restore on unmount.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    titleInputRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, []);

  // ESC to close + simple focus trap inside the dialog.
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
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Judul wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const normalizedAssignee = assigneeId || null;
    const payload = {
      title: trimmedTitle,
      description: description.trim(),
      assigneeId: normalizedAssignee,
      deadline: deadline ? deadline : null,
    };

    const url = mode === "create" ? "/api/tasks" : `/api/tasks/${task!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(
          mode === "create" ? "Gagal membuat tugas." : "Gagal menyimpan perubahan."
        );
        setSubmitting(false);
        return;
      }
      const saved = (await res.json()) as SavedTask;
      onSaved({ task: saved, assigneeId: normalizedAssignee });
    } catch {
      setError(
        mode === "create" ? "Gagal membuat tugas." : "Gagal menyimpan perubahan."
      );
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
          <h2
            id={headingId}
            className="text-base font-heading font-semibold text-[--fg]"
          >
            {mode === "create" ? "Tugas Baru" : "Ubah Tugas"}
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
            <div className="rounded-lg border border-[--destructive-border] bg-[--destructive-bg] px-3 py-2 text-sm text-[--destructive]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor={titleId} className="text-sm font-medium text-[--fg]">
              Judul
            </label>
            <input
              id={titleId}
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={descId} className="text-sm font-medium text-[--fg]">
              Deskripsi
            </label>
            <textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={assigneeFieldId}
              className="text-sm font-medium text-[--fg]"
            >
              Penanggung Jawab
            </label>
            <select
              id={assigneeFieldId}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            >
              <option value="">— Tidak ada —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.username})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={deadlineId} className="text-sm font-medium text-[--fg]">
              Tenggat
            </label>
            <input
              id={deadlineId}
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm font-mono text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="min-h-[40px] rounded-lg border border-[--border] bg-[--surface] px-4 text-sm font-semibold text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
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
