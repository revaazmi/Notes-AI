"use client";

export default function TrashError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-md p-xl">
      <p className="text-body-md text-semantic-error">Failed to load trash.</p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-md py-xs text-body-sm font-medium text-on-dark"
      >
        Retry
      </button>
    </div>
  );
}
