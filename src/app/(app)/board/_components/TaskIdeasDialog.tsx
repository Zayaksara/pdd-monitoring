"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ExternalLink, X } from "lucide-react";
import type { TaskWithRelations } from "@/server/tasks";
import type { listIdeas } from "@/server/ideas";

export type IdeaOption = Awaited<ReturnType<typeof listIdeas>>[number];

interface TaskIdeasDialogProps {
  task: TaskWithRelations;
  ideas: IdeaOption[];
  onClose: () => void;
  onAttached: (taskId: string, idea: IdeaOption) => void;
  onDetached: (taskId: string, ideaId: string) => void;
}

function safeHref(u: string): string | undefined {
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:" ? u : undefined;
  } catch {
    return undefined;
  }
}

export default function TaskIdeasDialog({
  task,
  ideas,
  onClose,
  onAttached,
  onDetached,
}: TaskIdeasDialogProps) {
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const headingId = useId();
  const selectId = useId();

  const attached = task.ideas;
  const attachedIds = useMemo(
    () => new Set(attached.map((a) => a.idea.id)),
    [attached]
  );
  const available = useMemo(
    () => ideas.filter((i) => !attachedIds.has(i.id)),
    [ideas, attachedIds]
  );

  const handleClose = useCallback(() => {
    if (busy) return;
    onClose();
  }, [busy, onClose]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current
      ?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      ?.focus();
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
      const enabled = Array.from(focusable).filter(
        (el) => !el.hasAttribute("disabled")
      );
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

  async function handleAttach() {
    if (!selected) return;
    const idea = ideas.find((i) => i.id === selected);
    if (!idea) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: selected }),
      });
      if (!res.ok) {
        setError("Gagal menautkan ide.");
        setBusy(false);
        return;
      }
      onAttached(task.id, idea);
      setSelected("");
    } catch {
      setError("Gagal menautkan ide.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDetach(ideaId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/ideas`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });
      if (!res.ok) {
        setError("Gagal menghapus tautan.");
        setBusy(false);
        return;
      }
      onDetached(task.id, ideaId);
    } catch {
      setError("Gagal menghapus tautan.");
    } finally {
      setBusy(false);
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
            Ide Terkait
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="shrink-0 rounded-lg p-1 text-[--muted-fg] hover:text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <p className="text-sm font-medium text-[--fg]">{task.title}</p>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {attached.length === 0 ? (
            <p className="text-sm text-[--muted-fg]">Belum ada ide terkait.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {attached.map(({ idea }) => (
                <li
                  key={idea.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-[--border] bg-[--muted] px-3 py-2"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm text-[--fg]">
                      {idea.title}
                    </span>
                    {idea.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {idea.links.map((link) => {
                          const href = safeHref(link.url);
                          const chipClassName =
                            "inline-flex items-center gap-1 rounded-full bg-[--surface] px-2 py-0.5 text-xs text-[--muted-fg] focus:outline-none focus:ring-2 focus:ring-[--primary]";
                          const chipContent = (
                            <>
                              <ExternalLink size={11} />
                              {link.label || "Tautan"}
                            </>
                          );
                          return href ? (
                            <a
                              key={link.id}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={chipClassName}
                            >
                              {chipContent}
                            </a>
                          ) : (
                            <span key={link.id} className={chipClassName}>
                              {chipContent}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDetach(idea.id)}
                    disabled={busy}
                    aria-label={`Hapus tautan ${idea.title}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[--muted-fg] hover:text-[--destructive] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={selectId}
              className="text-sm font-medium text-[--fg]"
            >
              Tautkan Ide
            </label>
            <div className="flex items-center gap-2">
              <select
                id={selectId}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={busy || available.length === 0}
                className="min-h-[40px] flex-1 rounded-lg border border-[--border] bg-[--surface] px-3 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
              >
                <option value="">
                  {available.length === 0
                    ? "— Tidak ada ide tersedia —"
                    : "— Pilih ide —"}
                </option>
                {available.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAttach}
                disabled={busy || !selected}
                className="min-h-[40px] shrink-0 rounded-lg bg-[--primary] px-4 text-sm font-semibold text-[--on-primary] hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
              >
                Tautkan
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="min-h-[40px] rounded-lg border border-[--border] bg-white px-4 text-sm font-semibold text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
