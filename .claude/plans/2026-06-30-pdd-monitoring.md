# PDD Monitoring App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight web app to monitor PDD (Publikasi, Dekorasi, Dokumentasi) work during KKN — a Kanban task board plus a two-way-linked Idea Bank, for 1 admin + 2 users, deployed free on Vercel Hobby.

**Architecture:** Next.js (App Router) full-stack. Server Components for reads, Route Handlers + Server Actions for writes. Postgres (Neon) via Prisma. Cookie-based session auth (no external auth service). All file references are external Google Drive/URL links — no uploads, no storage.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, Prisma + Neon Postgres, `@neondatabase/serverless` driver, `bcryptjs` for password hashing, `jose` for signed session cookies, `@hello-pangea/dnd` for Kanban drag-and-drop. Package manager: **pnpm**. Tests: **vitest**.

## Global Constraints

- Target deploy: **Vercel Hobby** — no long-running servers, no persistent filesystem, no paid add-ons.
- Database: **Neon** Postgres free tier. Use the serverless driver for Vercel compatibility.
- **No file/image uploads.** All references are stored as URLs (Google Drive links) only.
- Roles: exactly two — `admin` and `user`. Seeded accounts: 1 admin + users `nisa`, `fauziyah`.
- Drive reference categories (used as link labels, fixed enum): `DOKUMENTASI_RAW`, `RESULT_EDITING`, `ASSET_DESIGN`, `DOKUMENTASI_AKHIR`.
- Task statuses (fixed enum, ordered): `PLANNING`, `IN_PROGRESS`, `REVIEW`, `DONE`.
- Authorization rules (enforced server-side on every write):
  - Only `admin` creates/edits/deletes tasks and assigns them.
  - A `user` may change status of **their own** task only between `PLANNING`/`IN_PROGRESS`/`REVIEW` — never to/from `DONE`.
  - Only `admin` may set status to `DONE` or move it back out of `DONE`.
  - Anyone (admin or user) may create/edit ideas and attach ideas to tasks.
  - Only `admin` may promote an idea into a task.
  - Only `admin` may manage accounts.
- Responsive: must be usable on phone and laptop. Mobile-first Tailwind.
- All money/secrets via env vars: `DATABASE_DEPATABASE_URL`, `SESSION_SECRET`. Never commit secrets.

---

## File Structure

```
prisma/
  schema.prisma            # User, Task, Idea, IdeaLink, TaskIdea models + enums
  seed.ts                  # seeds admin + nisa + fauziyah
src/
  lib/
    db.ts                  # Prisma client singleton (Neon adapter)
    session.ts             # sign/verify session cookie (jose), get/set/clear
    auth.ts                # getCurrentUser(), requireUser(), requireAdmin()
    authz.ts               # pure authorization predicates (unit-tested)
    password.ts            # hash/verify wrappers (bcryptjs)
  middleware.ts            # redirect unauthenticated users to /login
  app/
    login/page.tsx         # login form (client) + action
    (app)/
      layout.tsx           # authed shell: nav (responsive), current user
      board/page.tsx       # Kanban board (server fetch) + client board
      board/_components/   # Column, Card, DnD wrapper, TaskDialog
      ideas/page.tsx       # Idea Bank list + create/edit
      ideas/_components/   # IdeaCard, IdeaDialog, LinkRow
      admin/users/page.tsx # account management (admin only)
    api/
      auth/login/route.ts  # POST login
      auth/logout/route.ts # POST logout
      tasks/route.ts       # POST create (admin)
      tasks/[id]/route.ts  # PATCH (status/edit), DELETE
      tasks/[id]/ideas/route.ts  # POST attach / DELETE detach idea
      ideas/route.ts       # GET list, POST create
      ideas/[id]/route.ts  # PATCH, DELETE
      ideas/[id]/promote/route.ts # POST promote idea -> task (admin)
      users/route.ts       # GET list, POST create (admin)
      users/[id]/route.ts  # PATCH, DELETE (admin)
  server/
    tasks.ts               # task data-access functions
    ideas.ts               # idea data-access functions
    users.ts               # user data-access functions
tests/
  authz.test.ts            # authorization predicate unit tests
  session.test.ts          # session sign/verify round-trip
```

Split by responsibility: `authz.ts` holds **pure** decision functions (no DB, fully unit-testable); `server/*.ts` holds DB access; route handlers are thin glue that calls `requireUser/requireAdmin`, then `authz`, then `server/*`.

---

## Task 1: Project scaffold + Tailwind + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `.gitignore`, `.env.example`

**Interfaces:**
- Produces: a runnable Next.js app at `/` and a working `pnpm dev`, `pnpm build`, `pnpm test`.

- [ ] **Step 1: Scaffold Next.js app**

Run in `D:\web-monitoring`:
```bash
pnpm dlx create-next-app@latest . --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --no-turbopack --use-pnpm
```
When prompted to install into a non-empty dir, accept (the `.claude/` folder is unrelated).

- [ ] **Step 2: Add runtime + dev dependencies**

```bash
pnpm add @prisma/client @neondatabase/serverless @prisma/adapter-neon bcryptjs jose @hello-pangea/dnd
pnpm add -D prisma vitest @types/bcryptjs tsx
```

- [ ] **Step 3: Add test + db scripts to package.json**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"db:push": "prisma db push",
"db:seed": "tsx prisma/seed.ts",
"postinstall": "prisma generate"
```

- [ ] **Step 4: Create `.env.example` and local `.env`**

`.env.example`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
SESSION_SECRET="replace-with-32+-char-random-string"
```
Copy to `.env` and fill with a real Neon connection string + a random secret. Confirm `.env` is gitignored.

- [ ] **Step 5: Wire design system fonts + tokens (per `.claude/DESIGN_SYSTEM.md`)**

In `src/app/layout.tsx`, load fonts via `next/font/google` and expose as CSS variables:
```tsx
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
const heading = Space_Grotesk({ subsets: ["latin"], weight: ["500","600","700"], variable: "--font-heading" });
const sans = Inter({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400","500"], variable: "--font-mono" });
// <body className={`${heading.variable} ${sans.variable} ${mono.variable} font-sans bg-[--bg] text-[--fg]`}>
```
In `src/app/globals.css`, after `@import "tailwindcss";`, declare the color tokens in `:root` and map fonts + key colors in an `@theme` block, copying the exact values from `.claude/DESIGN_SYSTEM.md` (Color Tokens table + Typography). Set `font-sans/font-heading/font-mono` to the CSS vars.

- [ ] **Step 6: Verify the app builds and runs**

Run: `pnpm build`
Expected: build completes with no errors.

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, Prisma, vitest, design tokens"
```

---

## Task 2: Prisma schema + Neon client + migrations

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`

**Interfaces:**
- Produces: `prisma` client export from `@/lib/db`; tables `User`, `Task`, `Idea`, `IdeaLink`, `TaskIdea`; enums `Role`, `TaskStatus`, `DriveCategory`.

- [ ] **Step 1: Write the schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role { admin user }
enum TaskStatus { PLANNING IN_PROGRESS REVIEW DONE }
enum DriveCategory { DOKUMENTASI_RAW RESULT_EDITING ASSET_DESIGN DOKUMENTASI_AKHIR }

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  name         String
  passwordHash String
  role         Role     @default(user)
  createdAt    DateTime @default(now())
  tasks        Task[]   @relation("assignee")
  createdTasks Task[]   @relation("creator")
  ideas        Idea[]
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String     @default("")
  status      TaskStatus @default(PLANNING)
  deadline    DateTime?
  assignee    User?      @relation("assignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  assigneeId  String?
  createdBy   User       @relation("creator", fields: [createdById], references: [id])
  createdById String
  ideas       TaskIdea[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Idea {
  id        String     @id @default(cuid())
  title     String
  notes     String     @default("")
  createdBy User       @relation(fields: [createdById], references: [id])
  createdById String
  links     IdeaLink[]
  tasks     TaskIdea[]
  createdAt DateTime   @default(now())
}

model IdeaLink {
  id       String        @id @default(cuid())
  idea     Idea          @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  ideaId   String
  url      String
  label    String        @default("")
  category DriveCategory?
}

model TaskIdea {
  task   Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId String
  idea   Idea   @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  ideaId String
  @@id([taskId, ideaId])
}
```

- [ ] **Step 2: Write the Neon-backed Prisma client singleton**

`src/lib/db.ts`:
```ts
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Push schema to Neon**

Run: `pnpm db:push`
Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 4: Generate client + typecheck**

Run: `pnpm prisma generate && pnpm exec tsc --noEmit`
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts
git commit -m "feat: add Prisma schema and Neon client"
```

---

## Task 3: Password + session utilities (unit-tested)

**Files:**
- Create: `src/lib/password.ts`, `src/lib/session.ts`, `tests/session.test.ts`

**Interfaces:**
- Produces:
  - `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>`
  - `createSessionToken(payload: { sub: string; role: "admin" | "user" }): Promise<string>`
  - `verifySessionToken(token: string): Promise<{ sub: string; role: "admin" | "user" } | null>`
  - `SESSION_COOKIE = "pdd_session"` constant

- [ ] **Step 1: Write password helpers**

`src/lib/password.ts`:
```ts
import bcrypt from "bcryptjs";
export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
```

- [ ] **Step 2: Write the failing session test**

`tests/session.test.ts`:
```ts
import { describe, it, expect, beforeAll } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/session";

beforeAll(() => { process.env.SESSION_SECRET = "test-secret-test-secret-test-secret"; });

describe("session token", () => {
  it("round-trips a valid payload", async () => {
    const token = await createSessionToken({ sub: "u1", role: "admin" });
    const decoded = await verifySessionToken(token);
    expect(decoded).toEqual({ sub: "u1", role: "admin" });
  });
  it("rejects a tampered token", async () => {
    const token = await createSessionToken({ sub: "u1", role: "user" });
    expect(await verifySessionToken(token + "x")).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run tests/session.test.ts`
Expected: FAIL (cannot import from `@/lib/session`).

- [ ] **Step 4: Implement session utilities**

`src/lib/session.ts`:
```ts
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pdd_session";
type Payload = { sub: string; role: "admin" | "user" };
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSessionToken(p: Payload): Promise<string> {
  return new SignJWT({ role: p.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<Payload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string") return null;
    const role = payload.role;
    if (role !== "admin" && role !== "user") return null;
    return { sub: payload.sub, role };
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/session.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/password.ts src/lib/session.ts tests/session.test.ts
git commit -m "feat: add password hashing and signed session tokens"
```

---

## Task 4: Authorization predicates (pure, unit-tested)

**Files:**
- Create: `src/lib/authz.ts`, `tests/authz.test.ts`

**Interfaces:**
- Consumes: `TaskStatus`, `Role` (string unions mirroring the Prisma enums).
- Produces:
  - `canCreateTask(role): boolean`
  - `canEditTask(role): boolean` (edit fields/assign/delete — admin only)
  - `canChangeStatus(args: { role; isAssignee: boolean; from: TaskStatus; to: TaskStatus }): boolean`
  - `canPromoteIdea(role): boolean`
  - `canManageUsers(role): boolean`
  - `canEditIdea(role): boolean` (always true for admin/user)

- [ ] **Step 1: Write the failing authz test**

`tests/authz.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { canCreateTask, canEditTask, canChangeStatus, canPromoteIdea, canManageUsers } from "@/lib/authz";

describe("task creation/edit", () => {
  it("only admin creates/edits tasks", () => {
    expect(canCreateTask("admin")).toBe(true);
    expect(canCreateTask("user")).toBe(false);
    expect(canEditTask("user")).toBe(false);
  });
});

describe("status changes", () => {
  const u = (from: any, to: any, isAssignee = true) =>
    canChangeStatus({ role: "user", isAssignee, from, to });

  it("assignee user may move between non-DONE states", () => {
    expect(u("PLANNING", "IN_PROGRESS")).toBe(true);
    expect(u("IN_PROGRESS", "REVIEW")).toBe(true);
    expect(u("REVIEW", "IN_PROGRESS")).toBe(true);
  });
  it("user may never touch DONE", () => {
    expect(u("REVIEW", "DONE")).toBe(false);
    expect(u("DONE", "REVIEW")).toBe(false);
  });
  it("user cannot change a task that is not theirs", () => {
    expect(u("PLANNING", "IN_PROGRESS", false)).toBe(false);
  });
  it("admin may move anything including DONE", () => {
    const a = (from: any, to: any) => canChangeStatus({ role: "admin", isAssignee: false, from, to });
    expect(a("REVIEW", "DONE")).toBe(true);
    expect(a("DONE", "PLANNING")).toBe(true);
  });
});

describe("idea promotion + user mgmt", () => {
  it("only admin promotes ideas and manages users", () => {
    expect(canPromoteIdea("admin")).toBe(true);
    expect(canPromoteIdea("user")).toBe(false);
    expect(canManageUsers("user")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/authz.test.ts`
Expected: FAIL (cannot import from `@/lib/authz`).

- [ ] **Step 3: Implement the predicates**

`src/lib/authz.ts`:
```ts
export type Role = "admin" | "user";
export type TaskStatus = "PLANNING" | "IN_PROGRESS" | "REVIEW" | "DONE";

export const canCreateTask = (role: Role) => role === "admin";
export const canEditTask = (role: Role) => role === "admin";
export const canEditIdea = (_role: Role) => true;
export const canPromoteIdea = (role: Role) => role === "admin";
export const canManageUsers = (role: Role) => role === "admin";

export function canChangeStatus(args: {
  role: Role; isAssignee: boolean; from: TaskStatus; to: TaskStatus;
}): boolean {
  const { role, isAssignee, from, to } = args;
  if (role === "admin") return true;
  // user path:
  if (!isAssignee) return false;
  if (from === "DONE" || to === "DONE") return false;
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/authz.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/authz.ts tests/authz.test.ts
git commit -m "feat: add pure authorization predicates with tests"
```

---

## Task 5: Seed script (admin + nisa + fauziyah)

**Files:**
- Create: `prisma/seed.ts`

**Interfaces:**
- Consumes: `hashPassword` from `@/lib/password`, `prisma` from `@/lib/db`.
- Produces: seeded rows: admin (username from env `SEED_ADMIN_USER`, default `admin`), users `nisa`, `fauziyah`.

- [ ] **Step 1: Write the seed script**

`prisma/seed.ts`:
```ts
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

async function upsertUser(username: string, name: string, role: "admin" | "user", password: string) {
  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { username },
    update: { name, role },
    create: { username, name, role, passwordHash },
  });
  console.log(`seeded ${role}: ${username}`);
}

async function main() {
  const adminUser = process.env.SEED_ADMIN_USER ?? "admin";
  const adminPass = process.env.SEED_ADMIN_PASS ?? "admin123";
  const userPass = process.env.SEED_USER_PASS ?? "user123";
  await upsertUser(adminUser, "Admin", "admin", adminPass);
  await upsertUser("nisa", "Nisa", "user", userPass);
  await upsertUser("fauziyah", "Fauziyah", "user", userPass);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the seed**

Run: `pnpm db:seed`
Expected: prints `seeded admin: admin`, `seeded user: nisa`, `seeded user: fauziyah`.

- [ ] **Step 3: Verify rows exist**

Run: `pnpm exec prisma studio` (open browser) OR `pnpm exec tsx -e "import('./src/lib/db').then(async m => { console.log(await m.prisma.user.count()) })"`
Expected: count is 3.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed admin and user accounts (nisa, fauziyah)"
```

---

## Task 6: Auth glue (current user) + login/logout API

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`

**Interfaces:**
- Consumes: `verifySessionToken`, `createSessionToken`, `SESSION_COOKIE`, `verifyPassword`, `prisma`.
- Produces:
  - `getCurrentUser(): Promise<{ id; username; name; role } | null>` (reads cookie)
  - `requireUser()`: returns user or throws `Response` 401
  - `requireAdmin()`: returns admin user or throws `Response` 403
  - `POST /api/auth/login` `{ username, password }` → sets cookie, returns `{ ok, role }`
  - `POST /api/auth/logout` → clears cookie

- [ ] **Step 1: Write auth helpers**

`src/lib/auth.ts`:
```ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, name: true, role: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Response("Forbidden", { status: 403 });
  return user;
}
```

- [ ] **Step 2: Write login route**

`src/app/api/auth/login/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: "missing" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }
  const token = await createSessionToken({ sub: user.id, role: user.role });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
```

- [ ] **Step 3: Write logout route**

`src/app/api/auth/logout/route.ts`:
```ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth
git commit -m "feat: add session auth helpers and login/logout routes"
```

---

## Task 7: Middleware + login page + authed shell

**Files:**
- Create: `src/middleware.ts`, `src/app/login/page.tsx`, `src/app/(app)/layout.tsx`
- Modify: `src/app/page.tsx` (redirect `/` → `/board`)

**Interfaces:**
- Consumes: `SESSION_COOKIE`, `getCurrentUser`.
- Produces: unauthenticated users are redirected to `/login`; authed shell renders responsive nav with links Board / Ideas / (Admin if admin) / Logout.

- [ ] **Step 1: Write middleware (cookie presence gate)**

`src/middleware.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";
  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL("/board", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```
Note: middleware only checks cookie presence (Edge can't reach Prisma). Real verification happens in pages via `getCurrentUser`.

- [ ] **Step 2: Write the login page**

`src/app/login/page.tsx` (client component): a centered card with username + password inputs, submit posts to `/api/auth/login`, on `ok` does `window.location.href = "/board"`, on error shows message. Mobile-first: `min-h-dvh flex items-center justify-center p-4`, card `w-full max-w-sm`.

```tsx
"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) window.location.href = "/board";
    else setError("Username atau password salah");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-slate-50">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">Monitoring PDD</h1>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Username"
          value={username} onChange={(e) => setU(e.target.value)} autoFocus />
        <input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="Password"
          value={password} onChange={(e) => setP(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full bg-slate-900 text-white rounded-lg py-2 disabled:opacity-50">
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Write the authed shell layout**

`src/app/(app)/layout.tsx`: server component; calls `getCurrentUser()`, if null `redirect("/login")`. Renders a responsive top nav (collapses to a simple row on mobile) with links to `/board`, `/ideas`, `/admin/users` (admin only), and a logout button (client island posting to `/api/auth/logout` then redirect `/login`). Show `user.name` + role badge.

- [ ] **Step 4: Redirect root to board**

`src/app/page.tsx`:
```tsx
import { redirect } from "next/navigation";
export default function Home() { redirect("/board"); }
```

- [ ] **Step 5: Manual verification**

Run: `pnpm dev`, open `http://localhost:3000`.
Expected: redirected to `/login`; logging in as `admin`/`admin123` lands on `/board` (board route added next task — for now create a placeholder `src/app/(app)/board/page.tsx` returning `<div>Board</div>` so navigation works).

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts "src/app/login" "src/app/(app)/layout.tsx" src/app/page.tsx
git commit -m "feat: add middleware gate, login page, and authed shell"
```

---

## Task 8: Task data-access layer

**Files:**
- Create: `src/server/tasks.ts`

**Interfaces:**
- Consumes: `prisma`.
- Produces:
  - `listTasks(): Promise<TaskWithRelations[]>` — all tasks with `assignee` + attached ideas (id, title, links).
  - `createTask(input: { title; description?; assigneeId?; deadline?: Date | null; createdById }): Promise<Task>`
  - `getTask(id): Promise<Task & { assigneeId: string | null; status: TaskStatus } | null>`
  - `updateTaskFields(id, input: { title?; description?; assigneeId?; deadline?: Date | null }): Promise<Task>`
  - `updateTaskStatus(id, status): Promise<Task>`
  - `deleteTask(id): Promise<void>`
  - exported type `TaskWithRelations`

- [ ] **Step 1: Implement data-access functions**

`src/server/tasks.ts`:
```ts
import { prisma } from "@/lib/db";
import type { TaskStatus } from "@prisma/client";

const include = {
  assignee: { select: { id: true, name: true, username: true } },
  ideas: { include: { idea: { include: { links: true } } } },
} as const;

export type TaskWithRelations = Awaited<ReturnType<typeof listTasks>>[number];

export function listTasks() {
  return prisma.task.findMany({ include, orderBy: { createdAt: "asc" } });
}
export function getTask(id: string) {
  return prisma.task.findUnique({ where: { id }, select: { id: true, assigneeId: true, status: true } });
}
export function createTask(input: {
  title: string; description?: string; assigneeId?: string | null; deadline?: Date | null; createdById: string;
}) {
  return prisma.task.create({ data: {
    title: input.title, description: input.description ?? "",
    assigneeId: input.assigneeId ?? null, deadline: input.deadline ?? null,
    createdById: input.createdById,
  } });
}
export function updateTaskFields(id: string, input: {
  title?: string; description?: string; assigneeId?: string | null; deadline?: Date | null;
}) {
  return prisma.task.update({ where: { id }, data: input });
}
export function updateTaskStatus(id: string, status: TaskStatus) {
  return prisma.task.update({ where: { id }, data: { status } });
}
export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/server/tasks.ts
git commit -m "feat: add task data-access layer"
```

---

## Task 9: Task API routes (create / edit / status / delete)

**Files:**
- Create: `src/app/api/tasks/route.ts`, `src/app/api/tasks/[id]/route.ts`

**Interfaces:**
- Consumes: `requireUser`, `requireAdmin`, `getCurrentUser`, task data-access fns, `canChangeStatus`.
- Produces:
  - `POST /api/tasks` (admin) `{ title, description?, assigneeId?, deadline? }` → created task
  - `PATCH /api/tasks/[id]` — if body has `status`, apply `canChangeStatus` rules; if body has other fields, require admin (`canEditTask`)
  - `DELETE /api/tasks/[id]` (admin)

- [ ] **Step 1: Write the create route**

`src/app/api/tasks/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createTask } from "@/server/tasks";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const b = await req.json();
    if (!b.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
    const task = await createTask({
      title: b.title.trim(), description: b.description ?? "",
      assigneeId: b.assigneeId || null,
      deadline: b.deadline ? new Date(b.deadline) : null,
      createdById: admin.id,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
```

- [ ] **Step 2: Write the update/delete route**

`src/app/api/tasks/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getTask, updateTaskFields, updateTaskStatus, deleteTask } from "@/server/tasks";
import { canChangeStatus } from "@/lib/authz";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    const body = await req.json();
    const task = await getTask(id);
    if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (typeof body.status === "string") {
      const allowed = canChangeStatus({
        role: user.role, isAssignee: task.assigneeId === user.id,
        from: task.status, to: body.status,
      });
      if (!allowed) return new NextResponse("Forbidden", { status: 403 });
      return NextResponse.json(await updateTaskStatus(id, body.status));
    }
    // field edits → admin only
    await requireAdmin();
    const updated = await updateTaskFields(id, {
      title: body.title, description: body.description,
      assigneeId: body.assigneeId ?? undefined,
      deadline: body.deadline === undefined ? undefined : body.deadline ? new Date(body.deadline) : null,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteTask(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
```

- [ ] **Step 3: Manual verification (admin create + user status)**

With `pnpm dev` running, logged in as admin, use the browser devtools console:
```js
await fetch("/api/tasks", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ title: "Test", assigneeId: null }) }).then(r => r.status)
```
Expected: `201`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/tasks"
git commit -m "feat: add task API routes with status authorization"
```

---

## Task 10: Kanban board UI (read + drag-and-drop status)

**Files:**
- Create: `src/app/(app)/board/page.tsx`, `src/app/(app)/board/_components/Board.tsx`, `.../Column.tsx`, `.../TaskCard.tsx`
- Modify: replace placeholder board page from Task 7.

**Interfaces:**
- Consumes: `listTasks`, `getCurrentUser`, task PATCH API.
- Produces: a 4-column board (`PLANNING`, `IN_PROGRESS`, `REVIEW`, `DONE`) rendering cards; drag to change status calls `PATCH /api/tasks/[id]`; on 403 the card snaps back and a toast/message shows. Deadline shown on card; overdue (deadline < now and status !== DONE) shows red.

- [ ] **Step 1: Server page fetches data**

`src/app/(app)/board/page.tsx`:
```tsx
import { getCurrentUser } from "@/lib/auth";
import { listTasks } from "@/server/tasks";
import Board from "./_components/Board";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const user = await getCurrentUser();
  const tasks = await listTasks();
  return <Board initialTasks={tasks} currentUser={user!} />;
}
```

- [ ] **Step 2: Client Board with DnD**

`src/app/(app)/board/_components/Board.tsx`: `"use client"`. Uses `@hello-pangea/dnd` (`DragDropContext`, `Droppable`, `Draggable`). State holds tasks grouped by status. On drag end: optimistically move card, `PATCH /api/tasks/[id]` with `{ status }`; if response not ok, revert and show inline error banner ("Tidak diizinkan memindahkan ke kolom ini"). Columns laid out responsive: horizontal scroll row on mobile (`flex gap-3 overflow-x-auto`), 4-up grid on `lg` (`lg:grid lg:grid-cols-4`).

Status columns constant:
```tsx
const COLUMNS = [
  { key: "PLANNING", label: "Planning" },
  { key: "IN_PROGRESS", label: "In-Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Done" },
] as const;
```

- [ ] **Step 3: TaskCard with deadline indicator**

`.../TaskCard.tsx`: shows title, assignee name, a deadline pill. Overdue logic:
```tsx
const overdue = task.deadline && task.status !== "DONE" && new Date(task.deadline) < new Date();
// pill className: overdue ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
```
Also shows a small count of attached ideas (e.g. "💡 2") linking to detail (wired in Task 12).

- [ ] **Step 4: Manual verification**

`pnpm dev`, login as admin, create a task via the New Task button (added in Task 11) or temporarily via console; drag it across columns → status persists after refresh. Login as `nisa`: dragging her task to DONE is rejected and snaps back.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/board"
git commit -m "feat: add Kanban board with drag-and-drop status changes"
```

---

## Task 11: Task create/edit dialog (admin) + assignee picker

**Files:**
- Create: `src/app/(app)/board/_components/TaskDialog.tsx`
- Modify: `Board.tsx` (add "Tugas Baru" button for admin, edit affordance on cards for admin), `board/page.tsx` (also fetch user list for assignee dropdown)
- Create: `src/server/users.ts` (if not present) with `listUsers()`

**Interfaces:**
- Consumes: `POST /api/tasks`, `PATCH /api/tasks/[id]`, `listUsers`.
- Produces: a modal form with title, description, assignee (`<select>` of users), deadline (`<input type="date">`). Visible only to admin. Submits then refreshes board state.

- [ ] **Step 1: Add `listUsers` to users data-access**

`src/server/users.ts`:
```ts
import { prisma } from "@/lib/db";
export function listUsers() {
  return prisma.user.findMany({ select: { id: true, name: true, username: true, role: true }, orderBy: { name: "asc" } });
}
```

- [ ] **Step 2: Fetch users in board page and pass to Board**

Modify `board/page.tsx` to also `const users = await listUsers();` and pass `users` to `<Board>`.

- [ ] **Step 3: Build TaskDialog**

`.../TaskDialog.tsx`: `"use client"`, controlled modal. Props: `mode: "create" | "edit"`, `task?`, `users`, `onSaved(task)`. On submit POST (create) or PATCH (edit). Only mounted/triggered when `currentUser.role === "admin"`. Deadline input value formatted `yyyy-MM-dd`.

- [ ] **Step 4: Wire buttons in Board**

In `Board.tsx`: if admin, show a "Tugas Baru" button opening TaskDialog in create mode; each card gets an edit (pencil) button for admin opening edit mode. After save, update local state.

- [ ] **Step 5: Manual verification**

Login as admin → create a task assigned to `nisa` with a past deadline → card shows red overdue pill in Planning. Edit it → change assignee → persists.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/board" src/server/users.ts
git commit -m "feat: add admin task create/edit dialog with assignee and deadline"
```

---

## Task 12: Idea Bank data-access + API

**Files:**
- Create: `src/server/ideas.ts`, `src/app/api/ideas/route.ts`, `src/app/api/ideas/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma`, `requireUser`, `getCurrentUser`.
- Produces:
  - `listIdeas()` — ideas with `links` and attached task ids/titles.
  - `createIdea({ title, notes?, createdById, links: { url; label?; category? }[] })`
  - `updateIdea(id, { title?; notes?; links? })` — replaces links set when `links` provided.
  - `deleteIdea(id)`
  - `GET/POST /api/ideas`, `PATCH/DELETE /api/ideas/[id]` (create/edit allowed for any authed user)

- [ ] **Step 1: Implement ideas data-access**

`src/server/ideas.ts`:
```ts
import { prisma } from "@/lib/db";
import type { DriveCategory } from "@prisma/client";

type LinkInput = { url: string; label?: string; category?: DriveCategory | null };

const include = {
  links: true,
  createdBy: { select: { id: true, name: true } },
  tasks: { include: { task: { select: { id: true, title: true } } } },
} as const;

export function listIdeas() {
  return prisma.idea.findMany({ include, orderBy: { createdAt: "desc" } });
}
export function createIdea(input: { title: string; notes?: string; createdById: string; links: LinkInput[] }) {
  return prisma.idea.create({ data: {
    title: input.title, notes: input.notes ?? "", createdById: input.createdById,
    links: { create: input.links.map(l => ({ url: l.url, label: l.label ?? "", category: l.category ?? null })) },
  }, include });
}
export async function updateIdea(id: string, input: { title?: string; notes?: string; links?: LinkInput[] }) {
  if (input.links) {
    await prisma.ideaLink.deleteMany({ where: { ideaId: id } });
  }
  return prisma.idea.update({ where: { id }, data: {
    title: input.title, notes: input.notes,
    ...(input.links ? { links: { create: input.links.map(l => ({ url: l.url, label: l.label ?? "", category: l.category ?? null })) } } : {}),
  }, include });
}
export async function deleteIdea(id: string) { await prisma.idea.delete({ where: { id } }); }
```

- [ ] **Step 2: Implement idea routes**

`src/app/api/ideas/route.ts`: `GET` → `listIdeas()` (requireUser); `POST` → requireUser, validate `title`, `createIdea` with `createdById = user.id`.
`src/app/api/ideas/[id]/route.ts`: `PATCH` → requireUser, `updateIdea`; `DELETE` → requireUser, `deleteIdea`. (Per spec, any authed user may edit ideas.) Wrap in the same `try/catch (e instanceof Response)` pattern as tasks.

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/server/ideas.ts "src/app/api/ideas"
git commit -m "feat: add idea bank data-access and API"
```

---

## Task 13: Idea Bank UI (list + create/edit with categorized links)

**Files:**
- Create: `src/app/(app)/ideas/page.tsx`, `.../_components/IdeaList.tsx`, `.../IdeaDialog.tsx`, `.../LinkRow.tsx`

**Interfaces:**
- Consumes: `listIdeas`, ideas API.
- Produces: a responsive card grid of ideas (title, notes, link chips colored by category, related task chips). "Ide Baru" button opens IdeaDialog. Link rows let the user add multiple `{ url, category }` entries with a category `<select>` of the 4 Drive categories.

- [ ] **Step 1: Category constant + labels**

In `LinkRow.tsx`:
```tsx
export const CATEGORIES = [
  { value: "DOKUMENTASI_RAW", label: "Dokumentasi Raw" },
  { value: "RESULT_EDITING", label: "Result Editing" },
  { value: "ASSET_DESIGN", label: "Asset Design" },
  { value: "DOKUMENTASI_AKHIR", label: "Dokumentasi Akhir" },
] as const;
```

- [ ] **Step 2: Server page**

`ideas/page.tsx`: server component, `const ideas = await listIdeas();` pass to `<IdeaList initialIdeas={ideas} />`. `export const dynamic = "force-dynamic";`

- [ ] **Step 3: IdeaDialog with dynamic link rows**

`.../IdeaDialog.tsx`: `"use client"`, form with title, notes (textarea), and a repeatable list of LinkRow (url input + category select + remove button) plus "Tambah Link". On submit POST/PATCH `/api/ideas`. Validate at least title present; ignore empty url rows.

- [ ] **Step 4: IdeaList render**

`.../IdeaList.tsx`: responsive grid `grid gap-3 sm:grid-cols-2 lg:grid-cols-3`. Each card shows title, notes (truncated), link chips (category-colored, `target="_blank" rel="noopener"`), related-task chips, and edit/delete buttons.

- [ ] **Step 5: Manual verification**

Login as `nisa` → create an idea with a Google Drive link tagged "Result Editing" → appears in grid; edit adds another link tagged "Asset Design".

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/ideas"
git commit -m "feat: add Idea Bank UI with categorized Drive links"
```

---

## Task 14: Two-way linking — attach idea↔task + promote idea→task

**Files:**
- Create: `src/app/api/tasks/[id]/ideas/route.ts`, `src/app/api/ideas/[id]/promote/route.ts`
- Modify: `src/server/tasks.ts` (`attachIdea`, `detachIdea`), `src/server/ideas.ts` (`promoteIdeaToTask`), board TaskCard/detail to show + manage attached ideas, IdeaDialog/IdeaList to attach to tasks.

**Interfaces:**
- Consumes: `requireUser`, `requireAdmin`, `canPromoteIdea`.
- Produces:
  - `attachIdea(taskId, ideaId)` / `detachIdea(taskId, ideaId)` (idempotent upsert/delete on `TaskIdea`).
  - `POST /api/tasks/[id]/ideas` `{ ideaId }` (requireUser) → attach; `DELETE` `{ ideaId }` → detach.
  - `promoteIdeaToTask(ideaId, createdById)` → creates a Task titled from the idea, links the idea to it, returns the task.
  - `POST /api/ideas/[id]/promote` (admin) → new task.

- [ ] **Step 1: Add attach/detach to tasks data-access**

In `src/server/tasks.ts`:
```ts
export function attachIdea(taskId: string, ideaId: string) {
  return prisma.taskIdea.upsert({
    where: { taskId_ideaId: { taskId, ideaId } },
    create: { taskId, ideaId }, update: {},
  });
}
export async function detachIdea(taskId: string, ideaId: string) {
  await prisma.taskIdea.delete({ where: { taskId_ideaId: { taskId, ideaId } } });
}
```

- [ ] **Step 2: Add promote to ideas data-access**

In `src/server/ideas.ts`:
```ts
export async function promoteIdeaToTask(ideaId: string, createdById: string) {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) throw new Error("idea not found");
  const task = await prisma.task.create({ data: {
    title: idea.title, description: idea.notes, createdById,
    ideas: { create: { ideaId } },
  } });
  return task;
}
```

- [ ] **Step 3: Attach/detach route**

`src/app/api/tasks/[id]/ideas/route.ts`: `POST` (requireUser) read `{ ideaId }`, call `attachIdea`; `DELETE` read `{ ideaId }`, call `detachIdea`. Same try/catch pattern.

- [ ] **Step 4: Promote route**

`src/app/api/ideas/[id]/promote/route.ts`: `POST` → `const admin = await requireAdmin();` then `promoteIdeaToTask(id, admin.id)`; return 201 with task. (Authz also guarded by `canPromoteIdea` for clarity.)

- [ ] **Step 5: UI wiring**

- On Idea cards (IdeaList): admin sees a "Jadikan Tugas" button → POST promote → toast "Tugas dibuat".
- On TaskDialog (edit mode) or a task detail panel: an "Ide Terkait" section listing attached ideas with remove (✕) and an "Tautkan Ide" picker (`<select>` of all ideas) → POST attach. Available to any authed user.
- TaskCard shows attached-idea count and, on expand, the idea links.

- [ ] **Step 6: Manual verification**

As admin: promote an idea → new task appears in Planning, already linked to that idea. As `nisa`: open her task, attach an existing idea → idea’s related-task chips now include that task.

- [ ] **Step 7: Commit**

```bash
git add "src/app/api/tasks" "src/app/api/ideas" src/server "src/app/(app)"
git commit -m "feat: two-way idea-task linking and idea promotion"
```

---

## Task 15: Account management (admin only)

**Files:**
- Create: `src/app/(app)/admin/users/page.tsx`, `.../_components/UserTable.tsx`, `.../UserDialog.tsx`, `src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts`
- Modify: `src/server/users.ts` (`createUser`, `updateUser`, `deleteUser`)

**Interfaces:**
- Consumes: `requireAdmin`, `hashPassword`, `canManageUsers`.
- Produces:
  - `createUser({ username, name, role, password })`, `updateUser(id, { name?; role?; password? })`, `deleteUser(id)`.
  - `GET/POST /api/users` (admin), `PATCH/DELETE /api/users/[id]` (admin).
  - Admin page: table of users with add/edit (set name/role/reset password)/delete. Guard: page calls `requireAdmin` server-side; non-admins are redirected by layout, but double-check and `redirect("/board")` if not admin.

- [ ] **Step 1: Extend users data-access**

In `src/server/users.ts`:
```ts
import { hashPassword } from "@/lib/password";
export async function createUser(input: { username: string; name: string; role: "admin" | "user"; password: string }) {
  return prisma.user.create({ data: {
    username: input.username, name: input.name, role: input.role,
    passwordHash: await hashPassword(input.password),
  }, select: { id: true, username: true, name: true, role: true } });
}
export async function updateUser(id: string, input: { name?: string; role?: "admin" | "user"; password?: string }) {
  return prisma.user.update({ where: { id }, data: {
    name: input.name, role: input.role,
    ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
  }, select: { id: true, username: true, name: true, role: true } });
}
export async function deleteUser(id: string) { await prisma.user.delete({ where: { id } }); }
```

- [ ] **Step 2: User API routes**

`src/app/api/users/route.ts`: `GET` (admin) → `listUsers()`; `POST` (admin) → validate username/password, `createUser`. Handle unique-username conflict → 409.
`src/app/api/users/[id]/route.ts`: `PATCH` (admin) → `updateUser`; `DELETE` (admin) → `deleteUser`, but block deleting the last admin (count admins; if deleting would leave 0, return 400 "minimal satu admin").

- [ ] **Step 3: Admin page + dialog**

`admin/users/page.tsx`: server component, `const me = await getCurrentUser(); if (me?.role !== "admin") redirect("/board");` then `listUsers()` → `<UserTable users={...} />`. UserDialog handles create (username+name+role+password) and edit (name+role+optional new password).

- [ ] **Step 4: Manual verification**

As admin → add a third user `rizki` → can log in with given password. Edit `nisa` → reset password works. Attempt to delete the only admin → blocked with message.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/admin" "src/app/api/users" src/server/users.ts
git commit -m "feat: add admin account management"
```

---

## Task 16: Responsive polish + empty/loading states + deploy config

**Files:**
- Modify: layout/nav, board, ideas pages; Create: `README.md`, `vercel.json` (optional), `.env` docs.

**Interfaces:**
- Produces: a coherent mobile/laptop experience; documented deploy steps.

- [ ] **Step 1: Mobile nav + tap targets**

Ensure nav collapses cleanly (single row with horizontal scroll or a compact menu) and all buttons are ≥40px tall on mobile. Board columns scroll horizontally on phones; cards full-width.

- [ ] **Step 2: Empty + loading states**

Add empty-state messages ("Belum ada tugas", "Belum ada ide") and disable buttons while requests are in flight (reuse the `loading` pattern from login).

- [ ] **Step 3: README with run + deploy steps**

`README.md`: how to set `DATABASE_URL` (Neon), `SESSION_SECRET`, run `pnpm db:push && pnpm db:seed && pnpm dev`, and Vercel deploy notes (set env vars in Vercel dashboard; Neon connection string with `?sslmode=require`; run seed once via `pnpm db:seed` against the prod DB or a one-off).

- [ ] **Step 4: Full build + test gate**

Run: `pnpm build && pnpm test`
Expected: build succeeds; all vitest tests pass.

- [ ] **Step 5: Deploy to Vercel**

Push to a GitHub repo, import into Vercel, set `DATABASE_URL` + `SESSION_SECRET` env vars, deploy. Run seed once against prod DB. Verify login works on the deployed URL from a phone and a laptop.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: responsive polish, empty states, and deploy docs"
```

---

## Self-Review Notes

- **Spec coverage:** Kanban 4-status (Tasks 8–11), admin-only create/assign + DONE approval + user status rules (Tasks 4, 9, 10), deadline + overdue indicator (Tasks 10–11), Idea Bank with Drive-categorized links + all-users edit (Tasks 12–13), two-way idea↔task + promote (Task 14), admin account management + username/password login (Tasks 5–7, 15), no uploads / link-only (Tasks 12–13), responsive + Vercel/Neon (Tasks 1, 16). ✓
- **Authorization** is centralized in `authz.ts` (unit-tested) and enforced in every write route. ✓
- **Type consistency:** enum string unions (`TaskStatus`, `Role`, `DriveCategory`) used identically across authz, server, and API layers. ✓
```
