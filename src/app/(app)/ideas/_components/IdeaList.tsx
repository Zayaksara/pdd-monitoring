"use client";

import { useState } from "react";
import { ClipboardCheck, ExternalLink, Lightbulb, Pencil, Plus, Trash2, X } from "lucide-react";
import type { DriveCategory } from "@prisma/client";
import type { listIdeas } from "@/server/ideas";
import { CATEGORIES } from "./LinkRow";
import IdeaDialog from "./IdeaDialog";

export type IdeaWithRelations = Awaited<ReturnType<typeof listIdeas>>[number];

interface IdeaListProps {
  initialIdeas: IdeaWithRelations[];
  canPromote: boolean;
}

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; idea: IdeaWithRelations }
  | null;

const CATEGORY_STYLES: Record<DriveCategory, string> = {
  DOKUMENTASI_RAW: "bg-slate-100 text-slate-700",
  RESULT_EDITING: "bg-teal-100 text-teal-800",
  ASSET_DESIGN: "bg-violet-100 text-violet-800",
  DOKUMENTASI_AKHIR: "bg-amber-100 text-amber-800",
};

const CATEGORY_LABELS: Record<DriveCategory, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
) as Record<DriveCategory, string>;

function safeHref(u: string): string | undefined {
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:" ? u : undefined;
  } catch {
    return undefined;
  }
}

export default function IdeaList({ initialIdeas, canPromote }: IdeaListProps) {
  const [ideas, setIdeas] = useState<IdeaWithRelations[]>(initialIdeas);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  async function handlePromote(idea: IdeaWithRelations) {
    setError(null);
    setNotice(null);
    setPromotingId(idea.id);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/promote`, {
        method: "POST",
      });
      if (!res.ok) {
        setError("Gagal menjadikan tugas.");
        return;
      }
      const task = (await res.json()) as { id: string; title: string };
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === idea.id
            ? {
                ...i,
                tasks: [
                  ...i.tasks,
                  {
                    taskId: task.id,
                    ideaId: i.id,
                    task: { id: task.id, title: task.title },
                  },
                ],
              }
            : i
        )
      );
      setNotice("Tugas dibuat.");
    } catch {
      setError("Gagal menjadikan tugas.");
    } finally {
      setPromotingId(null);
    }
  }

  function handleSaved(saved: IdeaWithRelations) {
    setIdeas((prev) => {
      const exists = prev.some((i) => i.id === saved.id);
      if (exists) return prev.map((i) => (i.id === saved.id ? saved : i));
      return [saved, ...prev];
    });
    setDialog(null);
  }

  async function handleDelete(idea: IdeaWithRelations) {
    if (!window.confirm(`Hapus ide "${idea.title}"?`)) return;
    setError(null);
    const prev = ideas;
    setIdeas((cur) => cur.filter((i) => i.id !== idea.id));
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, { method: "DELETE" });
      if (!res.ok) {
        setIdeas(prev);
        setError("Gagal menghapus ide.");
      }
    } catch {
      setIdeas(prev);
      setError("Gagal menghapus ide.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-[--fg]">
          Bank Ide
        </h1>
        <button
          type="button"
          onClick={() => setDialog({ mode: "create" })}
          className="flex min-h-[40px] items-center gap-2 rounded-lg bg-[--primary] px-4 text-sm font-semibold text-[--on-primary] hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-[--primary]"
        >
          <Plus size={16} />
          Ide Baru
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="shrink-0 rounded text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-[--primary]"
            aria-label="Tutup pesan kesalahan"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[--border] bg-[--muted] px-4 py-3 text-sm text-[--fg]">
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="shrink-0 rounded text-[--muted-fg] hover:text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            aria-label="Tutup pesan"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[--border] bg-[--surface] px-6 py-16 text-center">
          <Lightbulb size={28} className="text-[--muted-fg]" />
          <p className="text-sm text-[--muted-fg]">Belum ada ide.</p>
          <button
            type="button"
            onClick={() => setDialog({ mode: "create" })}
            className="flex min-h-[40px] items-center gap-2 rounded-lg bg-[--primary] px-4 text-sm font-semibold text-[--on-primary] hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-[--primary]"
          >
            <Plus size={16} />
            Ide Baru
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <article
              key={idea.id}
              className="flex flex-col gap-3 rounded-2xl border border-[--border] bg-[--surface] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-heading font-semibold text-[--fg]">
                  {idea.title}
                </h2>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDialog({ mode: "edit", idea })}
                    aria-label="Ubah ide"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[--muted-fg] hover:text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(idea)}
                    aria-label="Hapus ide"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[--muted-fg] hover:text-[--destructive] focus:outline-none focus:ring-2 focus:ring-[--primary]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {idea.notes && (
                <p className="line-clamp-2 text-sm text-[--muted-fg]">
                  {idea.notes}
                </p>
              )}

              {idea.links.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {idea.links.map((link) => {
                    const href = safeHref(link.url);
                    const chipClassName = `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[--primary] ${
                      link.category
                        ? CATEGORY_STYLES[link.category]
                        : "bg-[--muted] text-[--muted-fg]"
                    }`;
                    const chipContent = (
                      <>
                        <ExternalLink size={12} />
                        {link.category
                          ? CATEGORY_LABELS[link.category]
                          : link.label || "Tautan"}
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

              {idea.tasks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {idea.tasks.map(({ task }) => (
                    <span
                      key={task.id}
                      className="inline-flex items-center rounded-full bg-[--muted] px-2.5 py-1 text-xs text-[--muted-fg]"
                    >
                      {task.title}
                    </span>
                  ))}
                </div>
              )}

              {canPromote && (
                <button
                  type="button"
                  onClick={() => handlePromote(idea)}
                  disabled={promotingId === idea.id}
                  className="mt-auto flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-[--border] bg-white px-4 text-sm font-semibold text-[--fg] hover:bg-[--muted] focus:outline-none focus:ring-2 focus:ring-[--primary] disabled:opacity-50"
                >
                  <ClipboardCheck size={15} />
                  {promotingId === idea.id ? "Memproses…" : "Jadikan Tugas"}
                </button>
              )}

              <p className={`text-xs text-[--muted-fg] ${canPromote ? "" : "mt-auto"}`}>
                <span className="font-mono">{idea.createdBy.name}</span>
              </p>
            </article>
          ))}
        </div>
      )}

      {dialog && (
        <IdeaDialog
          mode={dialog.mode}
          idea={dialog.mode === "edit" ? dialog.idea : undefined}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
