export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-bg px-4 py-5 text-ink">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-xl bg-elevate" />
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />
          <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />
        </div>
      </div>
    </main>
  );
}
