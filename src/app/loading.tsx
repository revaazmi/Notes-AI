export default function RootLoading() {
  return (
    <div className="flex flex-col gap-section-sm p-xl animate-pulse">
      <div className="mb-lg h-8 w-48 rounded bg-hairline" />
      <div className="h-5 w-72 rounded bg-hairline" />
      <div className="mt-lg grid grid-cols-1 md:grid-cols-3 gap-xl">
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-md">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-surface p-xl">
              <div className="mb-sm h-5 w-3/4 rounded bg-hairline" />
              <div className="mb-sm h-4 w-full rounded bg-hairline" />
              <div className="h-4 w-1/2 rounded bg-hairline" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-lg">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-surface p-xl">
              <div className="mb-sm h-5 w-3/4 rounded bg-hairline" />
              <div className="h-4 w-1/2 rounded bg-hairline" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
