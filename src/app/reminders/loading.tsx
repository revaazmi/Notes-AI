export default function RemindersLoading() {
  return (
    <div className="flex flex-col gap-section-sm p-xl animate-pulse">
      <div className="h-8 w-48 rounded bg-hairline" />
      <div className="h-5 w-48 rounded bg-hairline" />
      <div className="mt-md rounded-lg bg-surface p-lg">
        <div className="mb-md h-6 w-36 rounded bg-hairline" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-md">
          <div className="h-10 rounded-lg bg-hairline" />
          <div className="h-10 rounded-lg bg-hairline" />
          <div className="h-10 rounded-lg bg-hairline" />
          <div className="h-10 rounded-md bg-hairline" />
        </div>
      </div>
      <div className="flex flex-col gap-sm">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-surface p-lg">
            <div className="mb-xs h-5 w-1/2 rounded bg-hairline" />
            <div className="h-4 w-1/3 rounded bg-hairline" />
          </div>
        ))}
      </div>
    </div>
  );
}
