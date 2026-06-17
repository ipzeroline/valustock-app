export default function Loading() {
  return (
    <main className="min-h-screen bg-bg px-5 py-6 text-ink">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-elevate" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-36 animate-pulse rounded-2xl border border-line bg-surface" />
          <div className="h-36 animate-pulse rounded-2xl border border-line bg-surface" />
          <div className="h-36 animate-pulse rounded-2xl border border-line bg-surface" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
      </div>
    </main>
  );
}
