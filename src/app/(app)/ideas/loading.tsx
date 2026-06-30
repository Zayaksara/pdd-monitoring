export default function IdeasLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {/* Heading row */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded-lg bg-[--muted]" />
        <div className="h-10 w-28 rounded-lg bg-[--muted]" />
      </div>

      {/* Idea cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-[--border] bg-[--surface] p-4 shadow-sm"
          >
            <div className="h-5 w-3/4 rounded bg-[--muted]" />
            <div className="h-4 w-full rounded bg-[--muted]" />
            <div className="flex gap-1.5">
              <div className="h-6 w-20 rounded-full bg-[--muted]" />
              <div className="h-6 w-16 rounded-full bg-[--muted]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
