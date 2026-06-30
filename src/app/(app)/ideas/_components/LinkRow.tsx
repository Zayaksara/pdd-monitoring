"use client";

import { useId } from "react";
import { X } from "lucide-react";

export const CATEGORIES = [
  { value: "DOKUMENTASI_RAW", label: "Dokumentasi Raw" },
  { value: "RESULT_EDITING", label: "Result Editing" },
  { value: "ASSET_DESIGN", label: "Asset Design" },
  { value: "DOKUMENTASI_AKHIR", label: "Dokumentasi Akhir" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export interface LinkDraft {
  url: string;
  category: CategoryValue | "";
}

interface LinkRowProps {
  link: LinkDraft;
  onChange: (next: LinkDraft) => void;
  onRemove: () => void;
}

export default function LinkRow({ link, onChange, onRemove }: LinkRowProps) {
  const urlId = useId();
  const categoryId = useId();

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor={urlId} className="sr-only">
          Tautan
        </label>
        <input
          id={urlId}
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/…"
          value={link.url}
          onChange={(e) => onChange({ ...link, url: e.target.value })}
          className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
        />
      </div>
      <div className="flex w-36 flex-col gap-1.5">
        <label htmlFor={categoryId} className="sr-only">
          Kategori
        </label>
        <select
          id={categoryId}
          value={link.category}
          onChange={(e) =>
            onChange({ ...link, category: e.target.value as LinkDraft["category"] })
          }
          className="rounded-lg border border-[--border] bg-[--surface] px-3 py-2 text-sm text-[--fg] focus:outline-none focus:ring-2 focus:ring-[--primary]"
        >
          <option value="">Kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Hapus tautan"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[--border] bg-[--surface] text-[--muted-fg] hover:text-[--destructive] focus:outline-none focus:ring-2 focus:ring-[--primary]"
      >
        <X size={16} />
      </button>
    </div>
  );
}
