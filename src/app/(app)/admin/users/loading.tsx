export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {/* Heading row */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-7 w-36 rounded-lg bg-[--muted]" />
        <div className="h-10 w-32 rounded-lg bg-[--muted]" />
      </div>

      {/* User rows */}
      <ul className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-[--border] bg-[--surface] p-4 shadow-sm"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="h-4 w-32 rounded bg-[--muted]" />
              <div className="h-3 w-24 rounded bg-[--muted]" />
            </div>
            <div className="h-6 w-16 rounded-full bg-[--muted]" />
            <div className="h-10 w-20 rounded-lg bg-[--muted]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
