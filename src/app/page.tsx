export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[--bg]">
      <div className="rounded-2xl bg-[--surface] shadow-sm border border-[--border] p-8 max-w-sm w-full text-center">
        <h1 className="font-heading text-xl font-semibold text-[--fg] mb-2">
          Monitoring PDD
        </h1>
        <p className="text-sm text-[--muted-fg]">
          Aplikasi manajemen tugas dan Bank Ide KKN
        </p>
        <div className="mt-6">
          <span className="inline-block rounded-full bg-[--primary] text-[--on-primary] text-xs font-mono px-3 py-1">
            v0.1.0
          </span>
        </div>
      </div>
    </main>
  );
}
