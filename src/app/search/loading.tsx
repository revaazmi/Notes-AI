export default function SearchLoading() {
  return (
    <div className="flex flex-col gap-section-sm p-xl animate-pulse">
      <div className="h-8 w-36 rounded bg-hairline" />
      <div className="h-5 w-64 rounded bg-hairline" />
      <div className="mt-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-surface p-xl">
            <div className="mb-sm h-5 w-3/4 rounded bg-hairline" />
            <div className="mb-sm h-4 w-full rounded bg-hairline" />
            <div className="h-4 w-1/2 rounded bg-hairline" />
          </div>
        ))}
      </div>
    </div>
  );
}
