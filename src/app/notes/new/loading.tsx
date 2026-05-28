export default function NewNoteLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="flex items-center justify-between border-b border-hairline px-xl py-md">
        <div className="h-6 w-32 rounded bg-hairline" />
        <div className="flex gap-sm">
          <div className="h-9 w-20 rounded-md bg-hairline" />
          <div className="h-9 w-20 rounded-md bg-hairline" />
        </div>
      </div>
      <div className="flex-1 p-xl">
        <div className="mb-lg h-8 w-3/4 rounded bg-hairline" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-hairline" />
          <div className="h-4 w-5/6 rounded bg-hairline" />
          <div className="h-4 w-4/6 rounded bg-hairline" />
        </div>
      </div>
    </div>
  );
}
