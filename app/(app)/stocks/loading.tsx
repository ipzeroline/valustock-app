export default function StocksLoading() {
  return (
    <main className="min-h-screen bg-bg px-4 py-5 text-ink">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-7 w-56 animate-pulse rounded-lg bg-elevate" />
          <div className="h-10 w-72 animate-pulse rounded-xl bg-elevate" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 border-b border-line px-4 py-3 last:border-b-0">
              <div className="h-8 animate-pulse rounded-lg bg-elevate" />
              <div className="h-8 animate-pulse rounded-lg bg-elevate" />
              <div className="h-8 animate-pulse rounded-lg bg-elevate" />
              <div className="h-8 animate-pulse rounded-lg bg-elevate" />
              <div className="h-8 animate-pulse rounded-lg bg-elevate" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
