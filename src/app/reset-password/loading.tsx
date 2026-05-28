export default function ResetPasswordLoading() {
  return (
    <div className="flex flex-col gap-section-sm p-xl animate-pulse">
      <div className="h-8 w-48 rounded bg-hairline" />
      <div className="h-5 w-64 rounded bg-hairline" />
      <div className="mt-md rounded-lg bg-surface p-lg">
        <div className="mb-md h-5 w-32 rounded bg-hairline" />
        <div className="h-10 w-full rounded-lg bg-hairline" />
        <div className="mt-md h-5 w-40 rounded bg-hairline" />
        <div className="mt-1 h-10 w-full rounded-lg bg-hairline" />
        <div className="mt-md flex justify-end">
          <div className="h-9 w-36 rounded-md bg-hairline" />
        </div>
      </div>
    </div>
  );
}
