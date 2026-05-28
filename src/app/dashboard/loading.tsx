export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-section-sm p-xl animate-pulse">
      <div className="h-8 w-48 rounded bg-hairline" />
      <div className="h-5 w-64 rounded bg-hairline" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-surface p-lg">
            <div className="mb-xs h-5 w-3/4 rounded bg-hairline" />
            <div className="h-4 w-full rounded bg-hairline" />
          </div>
        ))}
      </div>
    </div>
  );
}
