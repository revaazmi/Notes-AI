export default function VerifyEmailLoading() {
  return (
    <div className="flex flex-col gap-section-sm p-xl animate-pulse">
      <div className="h-8 w-48 rounded bg-hairline" />
      <div className="h-5 w-64 rounded bg-hairline" />
      <div className="mt-md rounded-lg bg-surface p-lg">
        <div className="mb-md h-5 w-40 rounded bg-hairline" />
        <div className="h-4 w-full rounded bg-hairline" />
      </div>
    </div>
  );
}
