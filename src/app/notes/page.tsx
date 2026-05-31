"use client";

import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/use-api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { NoteCard } from "@/components/features/NoteCard";
import { Button } from "@/components/ui/Button";
import { stripMarkdown } from "@/lib/markdown";
import { useDebounce } from "@/lib/useDebounce";

interface NoteTag {
  id: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  pinned?: boolean;
  tags?: NoteTag[];
}

interface NotesResponse {
  data: Note[];
  total: number;
}

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
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

const PAGE_SIZE = 12;

export default function AllNotesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const isFiltering = !!(debouncedSearch || categoryFilter || tagFilter);

  const buildParams = (pageOffset: number) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(pageOffset) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter) params.set("category", categoryFilter);
    if (tagFilter) params.set("tag", tagFilter);
    return params;
  };

  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery<NotesResponse>({
    queryKey: ["notes-infinite", debouncedSearch, categoryFilter, tagFilter],
    queryFn: ({ pageParam }) => {
      const params = buildParams(pageParam as number);
      return fetch(`/api/notes?${params}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    staleTime: 30 * 1000,
  });

  const notes = data?.pages.flatMap((p) => p.data) || [];
  const total = data?.pages[0]?.total || 0;

  const { data: categoriesData } = useApi<Category[]>(["categories"], "/api/categories", true, 5 * 60 * 1000);
  const { data: tagsData } = useApi<Tag[]>(["tags"], "/api/tags", true, 5 * 60 * 1000);
  const categories = categoriesData || [];
  const allTags = tagsData || [];

  const allCategories = [...new Set([...notes.map((n) => n.category), ...categories.map((c) => c.name)])].sort();

  const loadedCount = notes.length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === notes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notes.map((n) => n.id)));
    }
  };

  const runBulk = async (action: string) => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = { ids: Array.from(selected), action };
      if (action === "category") body.value = bulkCategory;
      await fetch("/api/notes/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSelected(new Set());
      setBulkAction("");
      refetch();
    } catch { /* ignore */ }
    setBusy(false);
  };

  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectMode(false);
      setSelected(new Set());
      setBulkAction("");
      setBulkCategory("");
    } else {
      setSelectMode(true);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  return (
    <AuthGuard>
    <div className="flex flex-col gap-section-sm p-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="typography-heading-2 text-charcoal">All Notes</h1>
          <p className="text-body-md text-slate">{total} note{total !== 1 ? "s" : ""} total</p>
        </div>
        <div className="hidden sm:flex items-center gap-sm">
          <button
            onClick={toggleSelectMode}
            className={`text-body-sm font-medium transition-colors ${
              selectMode ? "text-slate hover:text-charcoal" : "text-primary hover:underline"
            }`}
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
          <Link href="/categories">
            <Button variant="ghost">Manage Categories</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-md items-start">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelected(new Set()); }}
          className="flex-1 rounded-lg border border-hairline bg-canvas px-md py-[10px] text-body-md text-ink outline-none placeholder:text-muted focus:border-primary"
          placeholder="Search by title or category..."
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`sm:hidden shrink-0 rounded-lg border px-3 py-[10px] transition-colors ${
            showFilters || categoryFilter || tagFilter
              ? "border-primary bg-primary/5 text-primary"
              : "border-hairline text-slate hover:bg-surface hover:text-charcoal"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
          </svg>
        </button>
      </div>

      <div className={`flex flex-col gap-md ${showFilters ? "flex" : "hidden"} sm:flex`}>
        <div className="grid grid-cols-2 sm:hidden gap-md">
          <Link
            href="/categories"
            className="rounded-lg border border-hairline bg-canvas px-md h-9 flex items-center text-body-sm text-ink truncate min-w-0 hover:bg-surface transition-colors"
          >
            Manage Categories
          </Link>
          <button
            onClick={toggleSelectMode}
            className={`rounded-lg border px-md h-9 inline-flex items-center justify-center text-body-md transition-colors ${
              selectMode
                ? "border-hairline bg-canvas text-slate hover:bg-surface hover:text-charcoal"
                : "border-hairline bg-canvas text-ink hover:bg-surface"
            }`}
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-md">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setSelected(new Set()); }}
          className="rounded-lg border border-hairline bg-canvas px-md h-9 text-body-md text-ink outline-none focus:border-primary"
        >
          <option value="">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => { setTagFilter(e.target.value); setSelected(new Set()); }}
          className="w-full sm:w-auto rounded-lg border border-hairline bg-canvas px-md h-9 text-body-md text-ink outline-none focus:border-primary"
        >
          <option value="">All Tags</option>
          {allTags.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
      </div>
      </div>

      {selected.size > 0 && (
        <>
          <div className="fixed bottom-0 left-0 right-0 z-50 block sm:hidden border-t border-hairline bg-canvas px-md py-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="text-body-sm font-medium text-ink shrink-0">{selected.size} selected</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                {bulkAction === "category" && (
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="flex-1 rounded-md border border-hairline bg-canvas px-2 py-1.5 text-body-xs text-ink outline-none focus:border-primary"
                  >
                    <option value="">Select category...</option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
                <select
                  value={bulkAction}
                  onChange={(e) => { setBulkAction(e.target.value); setBulkCategory(""); }}
                  className="rounded-md border border-hairline bg-canvas px-2 py-1.5 text-body-xs text-ink outline-none focus:border-primary"
                >
                  <option value="">Action</option>
                  <option value="pin">Pin</option>
                  <option value="unpin">Unpin</option>
                  <option value="delete">Trash</option>
                  <option value="category">Category</option>
                </select>
                {(bulkAction && bulkAction !== "category") || (bulkAction === "category" && bulkCategory) ? (
                  <button
                    onClick={() => runBulk(bulkAction)}
                    disabled={busy}
                    className="rounded-md bg-primary px-3 py-1.5 text-body-xs font-medium text-on-dark disabled:opacity-50"
                  >
                    {busy ? "..." : "Apply"}
                  </button>
                ) : null}
                <button onClick={() => setSelected(new Set())} className="text-body-xs text-slate hover:text-charcoal">
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center justify-between gap-md rounded-lg bg-surface px-md py-sm">
            <span className="text-body-sm text-ink">{selected.size} selected</span>
            <div className="flex items-center gap-2">
              {bulkAction === "category" && (
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
                >
                  <option value="">Select category...</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
              <select
                value={bulkAction}
                onChange={(e) => { setBulkAction(e.target.value); setBulkCategory(""); }}
                className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
              >
                <option value="">Bulk action...</option>
                <option value="pin">Pin</option>
                <option value="unpin">Unpin</option>
                <option value="delete">Move to Trash</option>
                <option value="category">Change Category</option>
              </select>
              {bulkAction && bulkAction !== "category" && (
                <Button variant="secondary" onClick={() => runBulk(bulkAction)} disabled={busy}>
                  {busy ? "Processing..." : "Apply"}
                </Button>
              )}
              {bulkAction === "category" && bulkCategory && (
                <Button variant="secondary" onClick={() => runBulk("category")} disabled={busy}>
                  {busy ? "Processing..." : "Apply"}
                </Button>
              )}
              <button onClick={() => setSelected(new Set())} className="text-body-sm text-steel hover:text-charcoal transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-surface p-xl">
              <div className="mb-sm h-5 w-3/4 rounded bg-hairline" />
              <div className="mb-sm h-4 w-full rounded bg-hairline" />
              <div className="h-4 w-1/2 rounded bg-hairline" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-md rounded-lg bg-surface p-hero">
          <p className="text-body-md text-semantic-error">Failed to load notes.</p>
          <Button variant="secondary" onClick={handleRetry}>Retry</Button>
        </div>
      )}

      {!isLoading && !isError && notes.length === 0 && (
        <div className="flex flex-col items-center gap-md rounded-lg bg-surface p-hero">
          <p className="text-body-md text-slate">
            {isFiltering ? "No notes match your filters." : "No notes yet."}
          </p>
          {!isFiltering && (
            <Link href="/notes/new">
              <Button variant="primary">Create your first note</Button>
            </Link>
          )}
        </div>
      )}

      {!isLoading && !isError && notes.length > 0 && (
        <div>
          {selectMode && (
            <label className="flex items-center gap-2 mb-md cursor-pointer justify-end">
              <input
                type="checkbox"
                checked={selected.size === notes.length}
                onChange={toggleSelectAll}
                className="h-5 w-5 appearance-none rounded-md border-2 border-hairline-strong checked:border-primary checked:bg-primary checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22white%22%3E%3Cpath%20d%3D%22M16.59%205.58L8%2014.17l-3.59-3.58L3%2012l5%205%2010-10z%22%2F%3E%3C%2Fsvg%3E')] bg-center bg-no-repeat bg-[length:14px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
              />
              <span className="text-body-xs text-slate select-none">Select all</span>
            </label>
          )}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md ${selected.size > 0 ? "pb-[72px] sm:pb-0" : ""}`}>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                title={note.title}
                preview={stripMarkdown(note.content?.slice(0, 120) || "")}
                category={note.category}
                updatedAt={formatTimeAgo(note.updatedAt)}
                pinned={!!note.pinned}
                tags={note.tags}
                selected={selectMode && selected.has(note.id)}
                onSelectChange={selectMode ? () => toggleSelect(note.id) : undefined}
              />
            ))}
          </div>
          {!isFiltering && hasNextPage && (
            <div className="mt-lg flex flex-col items-center gap-sm">
              <p className="text-body-sm text-stone">Showing {loadedCount} of {total}</p>
              <Button variant="secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}