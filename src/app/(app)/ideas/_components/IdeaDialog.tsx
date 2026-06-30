"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Plus, X } from "lucide-react";
import type { IdeaWithRelations } from "./IdeaList";
import LinkRow, { type LinkDraft } from "./LinkRow";

interface IdeaDialogProps {
  mode: "create" | "edit";
  idea?: IdeaWithRelations;
  onClose: () => void;
  onSaved: (idea: IdeaWithRelations) => void;
}

function initialLinks(idea?: IdeaWithRelations): LinkDraft[] {
  if (!idea || idea.links.length === 0) return [{ url: "", category: "" }];
  return idea.links.map((l) => ({
    url: l.url,
    category: (l.category ?? "") as LinkDraft["category"],
  }));
}

export default function IdeaDialog({
  mode,
  idea,
  onClose,
  onSaved,
}: IdeaDialogProps) {
  const [title, setTitle] = useState(idea?.title ?? "");
  const [notes, setNotes] = useState(idea?.notes ?? "");
  const [links, setLinks] = useState<LinkDraft[]>(() => initialLinks(idea));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const notesId = useId();
  const headingId = useId();

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [submitting, onClose]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    titleInputRef.current?.focus();
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

  function updateLink(index: number, next: LinkDraft) {
    setLinks((prev) => prev.map((l, i) => (i === index ? next : l)));
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function addLink() {
    setLinks((prev) => [...prev, { url: "", category: "" }]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Judul wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      title: trimmedTitle,
      notes: notes.trim(),
      links: links
        .filter((l) => l.url.trim())
        .map((l) => ({
          url: l.url.trim(),
          category: l.category || null,
        })),
    };

    const url = mode === "create" ? "/api/ideas" : `/api/ideas/${idea!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(
          mode === "create" ? "Gagal membuat ide." : "Gagal menyimpan perubahan."
        );
        setSubmitting(false);
        return;
      }
      const saved = (await res.json()) as IdeaWithRelations;
      onSaved({ ...saved, createdAt: new Date(saved.createdAt) });
    } catch {
      setError(
        mode === "create" ? "Gagal membuat ide." : "Gagal menyimpan perubahan."
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
            {mode === "create" ? "Ide Baru" : "Ubah Ide"}
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
            <label htmlFor={notesId} className="text-sm font-medium text-[--fg]">
              Catatan
            </label>
            <textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[--fg]">Tautan</span>
            {links.map((link, i) => (
              <LinkRow
                key={i}
                link={link}
                onChange={(next) => updateLink(i, next)}
                onRemove={() => removeLink(i)}
              />
            ))}
            <button
              type="button"
              onClick={addLink}
              className="flex min-h-[40px] w-fit items-center gap-1.5 rounded-lg border border-[--border] bg-[--surface] px-3 text-sm font-semibold text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
            >
              <Plus size={16} />
              Tambah Link
            </button>
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
