const COLUMNS = ["Planning", "In Progress", "Review", "Done"];

export default function BoardLoading() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {/* Heading row */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded-lg bg-[--muted]" />
        <div className="h-10 w-32 rounded-lg bg-[--muted]" />
      </div>

      {/* Columns */}
      <div className="flex gap-3 overflow-x-hidden pb-4 lg:grid lg:grid-cols-4">
        {COLUMNS.map((label) => (
          <div
            key={label}
            className="flex min-w-[80%] flex-col overflow-hidden rounded-2xl border border-[--border] lg:min-w-0"
          >
            <div className="flex items-center gap-2 bg-[--muted] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[--border]" />
              <span className="h-4 w-20 rounded bg-[--border]" />
            </div>
            <div className="flex flex-col gap-3 bg-[--bg] p-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl border border-[--border] bg-[--muted]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
