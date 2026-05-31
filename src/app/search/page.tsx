"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { NoteCard } from "@/components/features/NoteCard";
import { useDebounce } from "@/lib/useDebounce";
import { stripMarkdown } from "@/lib/markdown";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
}

interface NotesResponse {
  data: Note[];
  total: number;
}

interface Category {
  id: string;
  name: string;
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const hasQueryOrFilter = !!(debouncedQuery || categoryFilter);

  const params = new URLSearchParams({ limit: "50", offset: "0" });
  if (debouncedQuery) params.set("search", debouncedQuery);
  if (categoryFilter) params.set("category", categoryFilter);

  const { data: notesData, isLoading: loading, error: notesErr } = useApi<NotesResponse>(
    ["search-notes", debouncedQuery, categoryFilter],
    `/api/notes?${params}`,
    hasQueryOrFilter,
  );
  const notes = notesData?.data || [];

  const { data: categoriesData } = useApi<Category[]>(["categories"], "/api/categories", true, 5 * 60 * 1000);
  const categories = categoriesData || [];

  const allCategories = [...new Set([...notes.map((n) => n.category), ...categories.map((c) => c.name)])].sort();

  const notesErrMessage = notesErr ? "Failed to load notes" : "";

  return (
    <AuthGuard>
    <div className="flex flex-col gap-section-sm p-xl">
      <div>
        <h1 className="typography-heading-2 text-charcoal">Search</h1>
        <p className="text-body-md text-slate">Find notes by title, content, or category.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-md">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-hairline bg-canvas px-md py-[10px] text-body-md text-ink outline-none placeholder:text-muted focus:border-primary"
          placeholder="Search notes..."
          autoFocus
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto rounded-lg border border-hairline bg-canvas px-md py-[10px] text-body-md text-ink outline-none focus:border-primary"
        >
          <option value="">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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

      {notesErrMessage && !loading && (
        <div className="rounded-lg bg-surface p-lg text-center">
          <p className="text-body-sm text-semantic-error">{notesErrMessage}</p>
        </div>
      )}

      {!loading && !notesErr && notes.length === 0 && hasQueryOrFilter && (
        <div className="rounded-lg bg-surface p-hero text-center">
          <p className="text-body-md text-slate">No notes match your search.</p>
        </div>
      )}

      {!loading && !notesErr && !hasQueryOrFilter && (
        <div className="rounded-lg bg-surface p-hero text-center">
          <p className="text-body-md text-slate">Type something to search your notes.</p>
        </div>
      )}

      {!loading && !notesErr && notes.length > 0 && (
        <div>
          <p className="mb-md text-body-sm text-stone">{notes.length} result{notes.length > 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                title={note.title}
                preview={stripMarkdown(note.content?.slice(0, 120) || "")}
                category={note.category}
                updatedAt={formatTimeAgo(note.updatedAt)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}