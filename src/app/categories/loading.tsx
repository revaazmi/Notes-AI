export default function CategoriesLoading() {
  return (
    <div className="flex flex-col gap-section-sm p-xl animate-pulse">
      <div className="h-8 w-48 rounded bg-hairline" />
      <div className="h-5 w-64 rounded bg-hairline" />
      <div className="mt-md rounded-lg bg-surface p-lg">
        <div className="mb-md h-6 w-32 rounded bg-hairline" />
        <div className="h-10 w-full rounded-lg bg-hairline" />
        <div className="mt-md h-24 w-full rounded-lg bg-hairline" />
        <div className="mt-md flex justify-end">
          <div className="h-9 w-28 rounded-md bg-hairline" />
        </div>
      </div>
      <div className="flex flex-col gap-sm">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-surface p-lg">
            <div className="mb-xs h-5 w-1/3 rounded bg-hairline" />
            <div className="h-4 w-2/3 rounded bg-hairline" />
          </div>
        ))}
      </div>
    </div>
  );
}
