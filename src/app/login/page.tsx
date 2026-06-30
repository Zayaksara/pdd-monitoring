"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) window.location.href = "/board";
    else setError("Username atau password salah");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-[--bg]">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-sm border border-[--border] p-8">
        <div className="mb-8 text-center">
          <h1 className="font-heading font-semibold text-2xl text-[--fg] tracking-tight">
            Monitoring PDD
          </h1>
          <p className="mt-1 text-sm text-[--muted-fg]">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[--fg]"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setU(e.target.value)}
              className="w-full rounded-lg border border-[--border] bg-surface px-3 py-2.5 text-sm text-[--fg] placeholder:text-[--muted-fg] focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-[--primary] transition-colors"
              placeholder="Masukkan username"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[--fg]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setP(e.target.value)}
              className="w-full rounded-lg border border-[--border] bg-surface px-3 py-2.5 text-sm text-[--fg] placeholder:text-[--muted-fg] focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-[--primary] transition-colors"
              placeholder="Masukkan password"
            />
          </div>

          {error && (
            <p className="text-sm text-[--destructive] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 min-h-[40px] rounded-lg bg-primary text-on-primary font-semibold text-sm px-4 py-2.5 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-[--primary] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
