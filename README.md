# Monitoring PDD

Aplikasi monitoring tugas (Kanban) dan Bank Ide untuk tim PDD KKN. Dibangun dengan
Next.js 16 (App Router), React 19, Tailwind v4, dan Prisma 7 dengan Neon (Postgres serverless).

## Fitur

- **Papan Tugas (Kanban):** 4 kolom (Planning, In Progress, Review, Done), drag & drop,
  tenggat + indikator overdue. Admin membuat/menugaskan tugas dan menyetujui status Done.
- **Bank Ide:** catatan ide dengan tautan Google Drive berkategori (link-only, tanpa unggahan).
- **Keterkaitan ide ↔ tugas** dua arah, plus promosikan ide menjadi tugas.
- **Manajemen akun** oleh admin; login username + password.

## Prasyarat

- Node.js (Vercel default ≥ 21 disarankan — lihat catatan WebSocket di bawah)
- pnpm
- Database Postgres dari [Neon](https://neon.tech)

## Konfigurasi environment

Salin `.env.example` menjadi `.env` lalu isi kedua variabel berikut:

```bash
# Connection string Neon — WAJIB diakhiri ?sslmode=require
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"

# Rahasia sesi untuk menandatangani cookie — minimal 32 karakter
SESSION_SECRET="ganti-dengan-string-acak-minimal-32-karakter"
```

`SESSION_SECRET` harus ≥ 32 karakter. Hasilkan misalnya dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Menjalankan secara lokal

```bash
pnpm install      # pasang dependency (menjalankan prisma generate via postinstall)
pnpm db:push      # buat skema di database Neon
pnpm db:seed      # isi akun awal (admin + nisa + fauziyah)
pnpm dev          # jalankan di http://localhost:3000
```

### Akun hasil seed

`pnpm db:seed` membuat tiga akun (`prisma/seed.ts`):

| Username   | Peran   | Password (default)                          |
|------------|---------|---------------------------------------------|
| `admin`    | admin   | env `SEED_ADMIN_PASS` atau `admin123`       |
| `nisa`     | anggota | env `SEED_USER_PASS` atau `user123`         |
| `fauziyah` | anggota | env `SEED_USER_PASS` atau `user123`         |

Untuk produksi, set `SEED_ADMIN_PASS` dan `SEED_USER_PASS` (dan opsional `SEED_ADMIN_USER`)
sebelum menjalankan seed, supaya tidak memakai password default.

## Perintah lain

```bash
pnpm build        # build produksi
pnpm test         # unit test (Vitest: authz + session)
pnpm lint         # ESLint
```

## Deploy ke Vercel

> Catatan: deploy belum dilakukan otomatis — environment ini tidak punya kredensial Neon.
> Langkah berikut dijalankan oleh pemilik proyek.

1. Push repo ini ke GitHub, lalu **Import Project** di [Vercel](https://vercel.com/new).
2. Di **Project Settings → Environment Variables**, set kedua variabel untuk semua
   environment (Production/Preview/Development):
   - `DATABASE_URL` — connection string Neon dengan `?sslmode=require`.
   - `SESSION_SECRET` — string acak ≥ 32 karakter.
3. Deploy. Build menjalankan `prisma generate` (via `postinstall`) lalu `next build`.
4. **Inisialisasi database produksi** sekali — dorong skema dan isi akun terhadap DB Neon:
   ```bash
   # dijalankan lokal dengan DATABASE_URL menunjuk ke DB produksi
   pnpm db:push
   pnpm db:seed
   ```
5. Verifikasi login pada URL hasil deploy dari ponsel dan laptop.

### Catatan teknis deploy

- **Driver Neon serverless.** Koneksi memakai `@prisma/adapter-neon` (lihat `src/lib/db.ts`).
- **WebSocket.** Adapter Neon memerlukan WebSocket. Runtime Node ≥ 21 (default Vercel saat ini)
  menyediakannya secara native, jadi tidak perlu konfigurasi tambahan. Jika men-deploy pada
  Node 18/20, tambahkan paket `ws` dan set `neonConfig.webSocketConstructor` sesuai komentar
  di `src/lib/db.ts`.
- **Prisma 7 & `prisma db push`.** Jika CLI Prisma tidak menemukan `DATABASE_URL` saat
  menjalankan `prisma db push`, buat `prisma.config.ts` di root yang menyuplai URL tersebut
  (atau pastikan `.env` termuat di lingkungan eksekusi). Halaman aplikasi memakai
  `export const dynamic = "force-dynamic"` sehingga selalu dirender per-request.
