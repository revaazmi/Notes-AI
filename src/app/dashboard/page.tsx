"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { NoteCard } from "@/components/features/NoteCard";
import { AISuggestionCard } from "@/components/features/AISuggestionCard";
import { stripMarkdown } from "@/lib/markdown";
import { ReminderCard } from "@/components/features/ReminderCard";
import { Button } from "@/components/ui/Button";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
}

interface Reminder {
  id: string;
  title: string;
  dueAt: string;
  priority: "high" | "medium" | "low";
}

interface Announcement {
  id: string;
  title: string;
  content: string;
}

interface NotesResponse {
  data: Note[];
  total: number;
}

const suggestions = [
  { type: "summary" as const, title: "Summarize your CS notes", description: "Generate a concise summary of your latest lecture on supervised learning" },
  { type: "quiz" as const, title: "Quiz yourself on Chemistry", description: "Generate practice questions from your reaction mechanisms notes" },
  { type: "explain" as const, title: "Explain this concept", description: "Get a simple explanation of supply & demand elasticity" },
  { type: "paraphrase" as const, title: "Rewrite your draft", description: "Improve clarity and tone in your economics essay" },
];

function formatTimeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatReminderTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);

  if (days < 0) return "Overdue";
  if (days === 0) return "Today " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Tomorrow " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const { data: announcements } = useApi<Announcement[]>(["announcements"], "/api/announcements", true, 5 * 60 * 1000);
  const { data: notesRes, isLoading: notesLoading, error: notesErr, refetch: refetchNotes } = useApi<NotesResponse>(["notes"], "/api/notes?limit=4");
  const { data: reminders, isLoading: remindersLoading, error: remindersErr, refetch: refetchReminders } = useApi<Reminder[]>(["reminders"], "/api/reminders?limit=3");

  const notes = notesRes?.data || [];
  const notesError = notesErr ? "Failed to load notes" : "";
  const remindersError = remindersErr ? "Failed to load reminders" : "";

  return (
    <AuthGuard>
    <div className="flex flex-col gap-section-sm p-xl h-full min-h-0 overflow-y-auto">
      <div>
        <h1 className="typography-heading-2 text-charcoal">Dashboard</h1>
        <p className="text-body-md text-slate">Welcome back! Here&apos;s your notes overview.</p>
      </div>

      {announcements && announcements.length > 0 && (
        <div className="flex flex-col gap-md">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-lg border border-primary/20 bg-primary/5 p-md">
              <p className="text-body-xs uppercase tracking-wide text-muted mb-1">{a.title}</p>
              <p className="text-body-sm text-ink whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
        <div className="md:col-span-2 flex flex-col gap-lg min-h-0">
          <section className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h2 className="typography-heading-4 text-charcoal">Recent Notes</h2>
              <Link href="/notes" className="text-body-sm text-link-blue hover:underline">
                View All
              </Link>
            </div>

            {notesLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg bg-surface p-xl">
                    <div className="mb-sm h-5 w-3/4 rounded bg-hairline" />
                    <div className="mb-sm h-4 w-full rounded bg-hairline" />
                    <div className="h-4 w-1/2 rounded bg-hairline" />
                  </div>
                ))}
              </div>
            )}

            {notesError && (
              <div className="rounded-lg bg-surface p-lg text-center flex flex-col items-center gap-md">
                <p className="text-body-sm text-semantic-error">{notesError}</p>
                <Button variant="secondary" onClick={() => refetchNotes()}>Retry</Button>
              </div>
            )}

            {!notesLoading && !notesError && (
              <>
                {notes.length === 0 ? (
                  <div className="rounded-lg bg-surface p-lg text-center">
                    <p className="text-body-sm text-slate">No notes yet.</p>
                    <Link href="/notes/new" className="text-body-sm text-link-blue hover:underline">
                      Create your first note
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                    {notes.slice(0, 4).map((note) => (
                      <NoteCard
                        key={note.id}
                        id={note.id}
                        title={note.title}
                        preview={stripMarkdown(note.content?.slice(0, 100) || "")}
                        category={note.category}
                        updatedAt={formatTimeAgo(note.updatedAt)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-lg min-h-0">
          <section className="flex flex-col gap-md">
            <h2 className="typography-heading-4 text-charcoal">AI Suggestions</h2>
            {selectedSuggestion ? (
              (() => {
                const s = suggestions.find((s) => s.type === selectedSuggestion);
                if (!s) return null;
                return (
                  <AISuggestionCard
                    key={s.type}
                    suggestion={s}
                    mode="expanded"
                    onClick={() => setSelectedSuggestion(null)}
                  />
                );
              })()
            ) : (
              <div className="grid grid-cols-2 gap-sm">
                {suggestions.map((s) => (
                  <AISuggestionCard
                    key={s.type}
                    suggestion={s}
                    mode="compact"
                    onClick={() => setSelectedSuggestion(s.type)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h2 className="typography-heading-4 text-charcoal">Upcoming</h2>
              <Link href="/reminders" className="text-body-sm text-link-blue hover:underline">
                View All
              </Link>
            </div>

            {remindersLoading && (
              <div className="flex flex-col gap-sm">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg bg-surface p-lg">
                    <div className="mb-xs h-4 w-2/3 rounded bg-hairline" />
                    <div className="h-3 w-1/3 rounded bg-hairline" />
                  </div>
                ))}
              </div>
            )}

            {remindersError && (
              <div className="rounded-lg bg-surface p-lg text-center flex flex-col items-center gap-md">
                <p className="text-body-sm text-semantic-error">{remindersError}</p>
                <Button variant="secondary" onClick={() => refetchReminders()}>Retry</Button>
              </div>
            )}

            {!remindersLoading && !remindersError && (
              <>
                {reminders && reminders.length === 0 ? (
                  <div className="rounded-lg bg-surface p-lg text-center">
                    <p className="text-body-sm text-slate">No reminders.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-sm">
                    {(reminders || []).slice(0, 3).map((r) => (
                      <ReminderCard
                        key={r.id}
                        title={r.title}
                        time={formatReminderTime(r.dueAt)}
                        noteTitle=""
                        priority={r.priority}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
