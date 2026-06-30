# PROGRESS — Aplikasi Monitoring Kerja PDD (KKN)

> Baca file ini di awal tiap sesi Claude untuk konteks cepat. Update setelah tiap langkah selesai.

**Last updated:** 2026-06-30

## Ringkasan Proyek
Aplikasi monitoring kerja PDD selama KKN. Aktor: 1 admin + 2–3 user.
Fitur inti: **Kanban tugas (planning→in-progress→review→done)** + **Bank Ide (relasi dua arah dengan task)**.
Referensi via **link Google Drive** (tanpa upload). Deploy **Vercel Hobby**, gratis, dipakai hingga September 2026.
Detail lengkap: lihat [PRD.md](./PRD.md).

## Tech Stack
Next.js (App Router) · Neon Postgres · Prisma · Tailwind · Auth cookie/session.

## Keputusan Kunci (sudah final)
- Admin buat & assign task; user ubah status **sampai review**; **hanya admin approve `done`**.
- Task punya **deadline** + indikator lewat tenggat.
- Bank Ide: semua bisa tambah; **dua arah** (ide↔task) — lampir ke banyak task & promote ide→task (admin).
- Login username+password; **akun dikelola admin** di dalam app.
- Referensi = **link Drive/URL** saja, tanpa storage/upload.

## Status Pengerjaan

### ✅ Selesai
- [x] Brainstorming kebutuhan & keputusan fitur
- [x] PRD.md
- [x] PROGRESS.md
- [x] Implementation plan → [plans/2026-06-30-pdd-monitoring.md](./plans/2026-06-30-pdd-monitoring.md) (16 task)

### ⏳ Berikutnya (belum dikerjakan)
- [ ] Task 1: Scaffold project Next.js + Tailwind
- [ ] Skema Prisma + setup Neon
- [ ] Auth (session cookie) + seed akun
- [ ] Modul Tugas (Kanban + otorisasi status + deadline)
- [ ] Modul Bank Ide (CRUD + relasi dua arah)
- [ ] Halaman kelola akun (admin)
- [ ] Responsive polish (HP & laptop)
- [ ] Deploy ke Vercel + Neon

## Arsip Google Drive (4 kategori folder)
1. Dokumentasi Raw  2. Result Editing  3. Asset Design  4. Dokumentasi Akhir (After Movie).
Tiap link referensi diberi label kategori sesuai folder di atas.

## Akun Awal (Seed)
- Admin: pemilik proyek.  User: **nisa**, **fauziyah**.

## Pertanyaan Terbuka / Menunggu User
- (Tidak ada — semua keputusan inti sudah final.)

## Catatan Sesi
- 2026-06-30: Brainstorming selesai, PRD & PROGRESS dibuat. Stack Opsi A disetujui. Hierarki Drive & akun user difinalkan.
