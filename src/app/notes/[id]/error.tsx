"use client";

export default function NoteDetailError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-md p-hero text-center">
      <h2 className="typography-heading-3 text-charcoal">Failed to load note</h2>
      <p className="text-body-md text-slate max-w-md">{error.message || "An unexpected error occurred."}</p>
      <button onClick={() => reset()} className="rounded-md bg-primary px-4 py-2 text-button-md text-white hover:bg-primary-pressed transition-colors">
        Try again
      </button>
    </div>
  );
}
