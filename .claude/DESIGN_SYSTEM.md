# Design System — Monitoring PDD

> **Single source of truth for UI.** Every component MUST use these tokens. Do not invent new colors,
> fonts, or spacing. No gradients-on-everything, no purple/indigo default, no emoji-as-icons in chrome,
> no glassmorphism. Goal: a calm, focused productivity tool that looks intentional — not templated.
> Source: ui-ux-pro-max design intelligence (Productivity Tool palette + Space Grotesk/Inter pairing).

## Aesthetic Direction
**"Calm focus, decisive action."** Generous whitespace, flat surfaces, one accent color reserved for
primary actions only. Clarity over decoration. Light mode is the default and primary target.

## Color Tokens (light mode)
Define as CSS variables in `globals.css` (`:root`) and map to Tailwind via `@theme`.

| Token | Value | Use |
|-------|-------|-----|
| `--primary` | `#0D9488` (teal-600) | Primary buttons, active nav, focus ring, links |
| `--primary-hover` | `#0F766E` | Hover state for primary |
| `--on-primary` | `#FFFFFF` | Text/icons on primary |
| `--accent` | `#EA580C` (orange-600) | Reserved for ONE thing: the main CTA / "Tugas Baru". Use sparingly |
| `--on-accent` | `#FFFFFF` | Text on accent |
| `--bg` | `#F0FDFA` (teal-50 tint) | App background |
| `--surface` | `#FFFFFF` | Cards, dialogs, nav |
| `--fg` | `#134E4A` (teal-900) | Primary text |
| `--muted` | `#E8F1F4` | Subtle fills, column backgrounds |
| `--muted-fg` | `#64748B` (slate-500) | Secondary text, metadata |
| `--border` | `#CBD5E1` (slate-300) | Borders, dividers (use #99F6E4 teal border only on primary-tinted areas) |
| `--destructive` | `#DC2626` | Delete, overdue, errors |
| `--on-destructive` | `#FFFFFF` | Text on destructive |

### Status colors (Kanban columns — calm, distinct, never neon)
| Status | Accent bar / chip | Text |
|--------|-------------------|------|
| `PLANNING` | `#64748B` (slate-500) | slate-700 |
| `IN_PROGRESS` | `#0D9488` (teal-600) | teal-800 |
| `REVIEW` | `#F59E0B` (amber-500) | amber-800 |
| `DONE` | `#22C55E` (green-500) | green-800 |

Overdue deadline pill: `bg-red-100 text-red-700` (only when `deadline < now && status !== DONE`).

## Typography
Load via `next/font/google` in `src/app/layout.tsx`, expose as CSS vars, map in Tailwind `@theme`.

- **Headings / brand:** `Space Grotesk` (weights 500, 600, 700) — geometric, a little character. `font-heading`.
- **Body / UI:** `Inter` (400, 500, 600) — high legibility. Default `font-sans`.
- **Data / dates / counts / usernames:** `JetBrains Mono` (400, 500) — `font-mono`. Use for deadlines, idea counts, status timestamps.

Scale: page title `text-xl font-heading font-600`; section `text-base font-600`; body `text-sm`; metadata `text-xs text-[--muted-fg]`. Buttons: `font-600`, NOT uppercase except small labels.

## Shape, spacing, elevation
- Radius: cards/dialogs `rounded-2xl`, inputs/buttons `rounded-lg`, chips `rounded-full`.
- Elevation: one soft shadow only — `shadow-sm` for cards, `shadow-lg` for dialogs/modals. No layered/neon shadows.
- Spacing rhythm: 4 / 8 / 12 / 16 / 24 px (`gap-1..6`). Cards padded `p-4`. Generous column gaps (`gap-3`).
- Borders are 1px, subtle. Prefer whitespace + a left accent bar over heavy outlines.

## Components — rules
- **Buttons:** primary = teal solid; secondary = `border border-[--border] bg-white`; destructive = red, used only on confirm. Min height 40px on mobile. Disabled = `opacity-50`.
- **Cards (task):** white surface, `rounded-2xl shadow-sm`, a 3px left bar in the status color, title (`font-600`), assignee (mono, muted), deadline pill, idea count chip.
- **Kanban columns:** `bg-[--muted]` header strip with status color dot + count; cards stack with `gap-3`. Mobile: horizontal scroll (`flex overflow-x-auto snap-x`), each column `min-w-[80%]`. `lg`: 4-col grid.
- **Chips:** category links colored by Drive category (see below); related-task chips neutral.
- **Dialogs:** centered, `max-w-md`, `rounded-2xl shadow-lg`, backdrop `bg-black/30`. Focus trapped, ESC closes.
- **Empty states:** centered muted text + one primary action. e.g. "Belum ada tugas." Never a blank screen.
- **Loading:** skeleton blocks with reserved height (avoid layout shift); disable buttons while in flight.

## Drive category chip colors (Bank Ide links)
| Category | Chip |
|----------|------|
| `DOKUMENTASI_RAW` | `bg-slate-100 text-slate-700` |
| `RESULT_EDITING` | `bg-teal-100 text-teal-800` |
| `ASSET_DESIGN` | `bg-violet-100 text-violet-800` |
| `DOKUMENTASI_AKHIR` | `bg-amber-100 text-amber-800` |

## Accessibility & quality bar
- Contrast WCAG AA minimum. Focus-visible ring `ring-2 ring-[--primary]` on all interactive elements.
- All buttons/links keyboard reachable; dialogs trap focus and restore on close.
- Tap targets ≥40px on mobile. Test board + ideas at 360px width and at laptop width.
- Indonesian copy throughout (labels, buttons, empty states).

## Anti-slop checklist (every UI subagent must pass)
- [ ] Uses ONLY the tokens above — no stray hex, no default indigo/purple.
- [ ] Space Grotesk headings + Inter body + JetBrains Mono for data are actually wired.
- [ ] Accent orange appears in at most 1–2 places (primary CTA), not everywhere.
- [ ] No gradient backgrounds, no glassmorphism, no drop-shadow stacking.
- [ ] Real empty + loading states, not blank divs.
- [ ] Responsive verified at 360px and ≥1024px.
