"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  deletedAt: string;
}

function formatTimeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TrashPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrash = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notes?trash=true&limit=50");
      if (!res.ok) { setError("Failed to load trash."); return; }
      const json = await res.json();
      if (!json.data) { setError("Invalid response from server."); return; }
      setNotes(json.data);
    } catch {
      setError("Failed to load trash.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const restore = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}/restore`, { method: "POST" });
      if (!res.ok) { setError("Failed to restore note."); return; }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError("Failed to restore note.");
    }
  };

  const permanentDelete = async (id: string) => {
    if (!confirm("Permanently delete this note? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/notes/${id}?permanent=true`, { method: "DELETE" });
      if (!res.ok) { setError("Failed to delete note."); return; }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError("Failed to delete note.");
    }
  };

  return (
    <AuthGuard>
    <div className="flex flex-col gap-section-sm p-xl">
      <div>
        <h1 className="typography-heading-2 text-charcoal">Trash</h1>
        <p className="text-body-md text-slate">{notes.length} trashed note{notes.length !== 1 ? "s" : ""}</p>
        <div className="flex items-start gap-2 rounded-md bg-surface px-md py-sm text-body-xs text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Trashed notes are automatically permanently deleted after 7 days
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-surface p-xl">
              <div className="mb-sm h-5 w-3/4 rounded bg-hairline" />
              <div className="mb-sm h-4 w-full rounded bg-hairline" />
              <div className="h-4 w-1/2 rounded bg-hairline" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-surface p-lg text-center flex flex-col items-center gap-md">
          <p className="text-body-sm text-semantic-error">{error}</p>
          <Button variant="secondary" onClick={fetchTrash}>Retry</Button>
        </div>
      )}

      {!loading && !error && notes.length === 0 && (
        <div className="flex flex-col items-center gap-md rounded-lg bg-surface p-hero">
          <p className="text-body-md text-slate">Trash is empty.</p>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {notes.map((note) => (
            <div key={note.id} className="flex flex-col rounded-lg border border-hairline bg-canvas p-xl shadow-card">
              <h3 className="text-body-sm text-slate mb-sm">In category: {note.category}</h3>
              <h2 className="text-body-md font-medium text-charcoal mb-sm truncate">{note.title || "Untitled"}</h2>
              <p className="text-body-sm text-slate mb-lg">
                {note.content?.slice(0, 100) || "No content"}
              </p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-body-xs text-slate">Deleted {formatTimeAgo(note.deletedAt)}</span>
                <div className="flex gap-sm">
                  <Button variant="secondary" onClick={() => restore(note.id)}>
                    Restore
                  </Button>
                  <Button variant="ghost" className="text-semantic-error" onClick={() => permanentDelete(note.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
