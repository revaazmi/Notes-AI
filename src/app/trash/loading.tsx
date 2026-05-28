export default function TrashLoading() {
  return (
    <div className="flex flex-col gap-section-sm p-xl">
      <div className="mb-md h-8 w-24 animate-pulse rounded bg-hairline" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-surface p-xl">
            <div className="mb-sm h-5 w-3/4 rounded bg-hairline" />
            <div className="mb-sm h-4 w-full rounded bg-hairline" />
            <div className="h-4 w-1/2 rounded bg-hairline" />
          </div>
        ))}
      </div>
    </div>
  );
}
