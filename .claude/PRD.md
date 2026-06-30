# PRD — Aplikasi Monitoring Kerja PDD (KKN)

**Versi:** 1.0
**Tanggal:** 2026-06-30
**Status:** Disetujui — siap implementasi

---

## 1. Latar Belakang & Tujuan

Aplikasi untuk **monitoring kerja PDD (Publikasi, Dekorasi, Dokumentasi) selama KKN**. Tujuan utama:
efisiensi & produktivitas tim, dapat dipakai fleksibel di **HP maupun laptop** (responsive),
ringan, dan **gratis** (deploy di **Vercel Hobby**). Periode pemakaian: hingga **September 2026**.

## 2. Aktor / Peran

| Peran | Jumlah | Hak Akses |
|-------|--------|-----------|
| **Admin** | 1 | Membuat & assign task, approve task ke `done`, kelola akun user, tambah/edit ide |
| **User** | 2–3 | Mengubah status task miliknya (sampai `review`), menambah/edit ide |

Jumlah user fleksibel (2–3). Akun dikelola admin (CRUD user di dalam app).

## 3. Fitur Utama

### 3.1 Monitoring Tugas (Kanban Board)
- 4 kolom status: **Planning → In-Progress → Review → Done**.
- **Admin** membuat task dan meng-assign ke salah satu user.
- **User** memindahkan status task miliknya **hanya sampai `review`**.
- **Hanya admin** yang dapat memindahkan task ke **`done`** (verifikasi/approval).
- Setiap task punya **deadline (tanggal)** yang tampil di kartu, dengan **indikator visual bila lewat tenggat** (mis. warna merah).
- Field task: judul, deskripsi, assignee, status, deadline, ide terkait (lihat 3.2).

### 3.2 Bank Ide
- Koleksi referensi. Field ide: **judul + catatan + satu/lebih link** (Google Drive / URL).
- **Semua peran (admin & user) bisa menambah & mengedit ide.**
- **Relasi dua arah dengan task:**
  1. Satu ide dapat **dilampirkan ke banyak task** sebagai referensi.
  2. Sebuah ide dapat **dipromosikan menjadi task** (oleh admin).
- Di kartu task ditampilkan daftar **ide terkait** beserta link-nya, agar user mudah melihat referensi saat mengerjakan.

### 3.3 Pengelolaan Akun (Admin)
- Login: **username + password** (session berbasis cookie).
- Admin dapat **menambah / menghapus / mengatur** user dari dalam app.

## 4. Penyimpanan Referensi (Google Drive)
- **Tidak ada upload file/gambar ke server** — semua referensi berupa **link Google Drive / URL**.
  Menghindari kebutuhan storage, konversi WebP, dan beban Vercel Hobby.
- **Hierarki arsip Google Drive** (4 kategori folder utama):
  1. **Dokumentasi Raw** — file mentah hasil rekam/foto.
  2. **Result Editing** — hasil editan.
  3. **Asset Design** — aset desain (template, grafis, dll).
  4. **Dokumentasi Akhir (After Movie)** — output final.
- Tiap link referensi pada ide/task diberi **label kategori** sesuai 4 folder di atas, agar arsip
  di app selaras dengan struktur Drive. *(Bisa dijadikan opsi label dropdown saat menambah link.)*

## 5. Tech Stack (Opsi A — disetujui)

- **Framework:** Next.js (App Router), full-stack, deploy ke **Vercel Hobby**.
- **Database:** **Neon** (Postgres serverless, free tier).
- **ORM:** Prisma.
- **Auth:** session sederhana berbasis cookie (cukup untuk ±4 akun), password di-hash.
- **UI:** Tailwind CSS, kanban drag-and-drop ringan, **responsive HP & laptop**.

## 6. Model Data (draft)

- **User**: id, username, password_hash, role (`admin` | `user`), nama, createdAt.
- **Task**: id, judul, deskripsi, assigneeId, status (`planning`|`in_progress`|`review`|`done`), deadline, createdById, createdAt, updatedAt.
- **Idea**: id, judul, catatan, createdById, createdAt. (link disimpan terpisah / array)
- **IdeaLink**: id, ideaId, url, label.
- **TaskIdea** (relasi many-to-many): taskId, ideaId.

## 7. Aturan Otorisasi (ringkas)

| Aksi | Admin | User |
|------|:-----:|:----:|
| Buat task & assign | ✅ | ❌ |
| Ubah status sampai `review` | ✅ | ✅ (hanya task miliknya) |
| Pindah ke `done` | ✅ | ❌ |
| Tambah/edit ide | ✅ | ✅ |
| Lampirkan ide ke task | ✅ | ✅ |
| Promosikan ide → task | ✅ | ❌ |
| Kelola akun | ✅ | ❌ |

## 8. Non-Goals (YAGNI)
- Tidak ada upload file/gambar (pakai link Drive).
- Tidak ada notifikasi push/email (kecuali diminta nanti).
- Tidak ada chat/komentar real-time.
- Tidak ada laporan/analitik kompleks.

## 9. Kriteria Sukses
- Admin bisa buat & assign task; user bisa geser status sampai review; admin approve done.
- Bank Ide dua arah berfungsi (lampir ke task & promote ke task).
- Nyaman dipakai di HP & laptop.
- Berjalan stabil & gratis di Vercel Hobby hingga September 2026.

## 10. Akun Awal (Seed)
- **Admin:** (pemilik proyek) — username & password ditentukan saat seed.
- **User:** `nisa`, `fauziyah` (2 user).

## 11. Pertanyaan Terbuka
- (Tidak ada — semua keputusan inti sudah final.)
