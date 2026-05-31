"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useApi } from "@/lib/use-api";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/Button";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

interface NoteEditorProps {
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
  category?: string;
}

export function NoteEditor({ noteId, initialTitle = "", initialContent = "", category = "General" }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [currentCategory, setCurrentCategory] = useState(category);
  const [addedTags, setAddedTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [savedState, setSavedState] = useState({ title: initialTitle, content: initialContent, category });
  const [actionError, setActionError] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const mountedRef = useRef(true);
  const aiCtrl = useRef<AbortController | null>(null);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [localShareSlug, setLocalShareSlug] = useState<string | null>(null);
  const [localShareOn, setLocalShareOn] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [localNoteTags, setLocalNoteTags] = useState<{ id: string; name: string; color: string }[] | null>(null);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");
  const isPreloaded = useMemo(() => !!(noteId && (initialTitle || initialContent)), [noteId, initialTitle, initialContent]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDirty = useMemo(() => (
    title !== savedState.title ||
    content !== savedState.content ||
    currentCategory !== savedState.category
  ), [title, content, currentCategory, savedState]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const { data: categoriesData } = useApi<{ id: string; name: string; template: string }[]>(["categories"], "/api/categories", true, 5 * 60 * 1000);
  const { data: tagsData } = useApi<{ id: string; name: string; color: string }[]>(["tags"], "/api/tags", true, 5 * 60 * 1000);
  const { data: noteDetail } = useApi<{ isPublic: boolean; shareSlug: string; tags: { id: string; name: string; color: string }[] } | null>(
    ["editor-note", noteId || ""],
    noteId ? `/api/notes/${noteId}` : "",
    !!noteId
  );

  const categories = categoriesData || [];
  const userTags = useMemo(() => {
    const tagMap = new Map<string, { id: string; name: string; color: string }>();
    for (const t of (tagsData || [])) tagMap.set(t.id, t);
    for (const t of addedTags) tagMap.set(t.id, t);
    return Array.from(tagMap.values());
  }, [tagsData, addedTags]);

  const shareOn = localShareOn ?? noteDetail?.isPublic ?? false;
  const shareSlug = localShareSlug ?? noteDetail?.shareSlug ?? null;
  const noteTags = localNoteTags ?? noteDetail?.tags ?? [];

  const toggleShare = async () => {
    if (!noteId) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !shareOn }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalShareOn(!shareOn);
        if (data.shareSlug) setLocalShareSlug(data.shareSlug);
      }
    } catch { /* ignore */ }
    setSharing(false);
  };

  const copyShareLink = () => {
    if (!shareSlug) return;
    const url = `${window.location.origin}/share/${shareSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addTagToNote = async (tagId: string) => {
    if (!noteId) return;
    const res = await fetch(`/api/notes/${noteId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    if (res.ok) {
      const tag = userTags.find((t) => t.id === tagId);
      if (tag) setLocalNoteTags((prev) => [...(prev || []), tag]);
    }
  };

  const removeTagFromNote = async (tagId: string) => {
    if (!noteId) return;
    await fetch(`/api/notes/${noteId}/tags`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    setLocalNoteTags((prev) => (prev || []).filter((t) => t.id !== tagId));
  };

  const createAndAddTag = async () => {
    if (!noteId || !tagInputValue.trim()) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tagInputValue.trim(), color: "#6C4CE0" }),
    });
    if (res.ok) {
      const newTag = await res.json();
      setAddedTags((prev) => [...prev, newTag]);
      await addTagToNote(newTag.id);
      setTagInputValue("");
      setShowTagInput(false);
    }
  };

  useEffect(() => {
    if (!noteId) return;
    if (isPreloaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNoteLoading(false);
      setSavedState({ title: initialTitle, content: initialContent, category });
      return;
    }
    let cancelled = false;
    setNoteLoading(true);
    fetch(`/api/notes/${noteId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setTitle(data.title);
        setContent(data.content);
        setCurrentCategory(data.category || "General");
        setSavedState({ title: data.title, content: data.content, category: data.category || "General" });
      })
      .catch(() => { if (!cancelled) setActionError("Failed to load note"); })
      .finally(() => { if (!cancelled) setNoteLoading(false); });
    return () => { cancelled = true; };
  }, [noteId, isPreloaded, initialTitle, initialContent, category]);

  useEffect(() => {
    if (!noteId || !isDirty) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, category: currentCategory }),
        });
        if (cancelled) return;
        if (res.ok) setSavedState({ title, content, category: currentCategory });
        else setActionError("Auto-save failed");
      } catch {
        if (!cancelled) setActionError("Auto-save failed");
      }
    }, 1500);
    return () => { clearTimeout(timer); cancelled = true; };
  }, [title, content, currentCategory, noteId, isDirty]);

  const readAIStream = async (res: Response) => {
    const body = res.body;
    if (!body) { setAiResult("No response body"); setAiLoading(false); return; }
    const reader = body.getReader();
    const decoder = new TextDecoder();
    while (mountedRef.current) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!mountedRef.current) { reader.cancel(); break; }
      setAiResult((prev) => prev + decoder.decode(value, { stream: true }));
    }
  };

  const runAI = async (action: string) => {
    setAiLoading(true);
    setAiResult("");
    aiCtrl.current?.abort();
    const ctrl = new AbortController();
    aiCtrl.current = ctrl;
    try {
      const res = await fetch(`/api/ai/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      if (!res.ok) { setAiResult("Request failed"); setAiLoading(false); return; }
      await readAIStream(res);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setAiResult("Failed to get AI response. Check your GROQ_API_KEY.");
    } finally {
      if (mountedRef.current) setAiLoading(false);
    }
  };

  const runAsk = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiResult("");
    aiCtrl.current?.abort();
    const ctrl = new AbortController();
    aiCtrl.current = ctrl;
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, question: aiQuestion }),
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      if (!res.ok) { setAiResult("Request failed"); setAiLoading(false); return; }
      await readAIStream(res);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setAiResult("Failed to get AI response. Check your GROQ_API_KEY.");
    } finally {
      if (mountedRef.current) setAiLoading(false);
    }
  };

  const save = useCallback(async () => {
    try {
      if (noteId) {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, category: currentCategory }),
        });
        if (!res.ok) { setActionError("Failed to save note."); return; }
        setSavedState({ title, content, category: currentCategory });
      } else {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, category: currentCategory }),
        });
        if (!res.ok) { setActionError("Failed to save note."); return; }
        const note = await res.json();
        if (!note?.id) { setActionError("Invalid response from server."); return; }
        setSavedState({ title, content, category: currentCategory });
        router.push(`/notes/${note.id}`);
      }
    } catch {
      setActionError("Failed to save note.");
    }
  }, [noteId, title, content, currentCategory, router]);

  const deleteNote = async () => {
    if (!noteId) return;
    if (!confirm("Move this note to trash?")) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) { setActionError("Failed to delete note."); return; }
      router.push("/notes");
    } catch {
      setActionError("Failed to delete note.");
    }
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const triggerDownload = (format: "pdf" | "docx") => {
    const url = `/api/notes/${noteId}/download?format=${format}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "untitled"}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const exportPDF = () => triggerDownload("pdf");

  const exportDOCX = () => triggerDownload("docx");

  const formatText = useCallback((format: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    let replacement = "";
    let cursorPos = start;

    switch (format) {
      case "bold":
        replacement = `**${selected || "bold"}**`;
        cursorPos = selected ? start + replacement.length : start + 2;
        break;
      case "italic":
        replacement = `*${selected || "italic"}*`;
        cursorPos = selected ? start + replacement.length : start + 1;
        break;
      case "heading":
        replacement = `## ${selected || "heading"}`;
        cursorPos = selected ? start + replacement.length : start + 3;
        break;
      case "bullet":
        replacement = `- ${selected || "item"}`;
        cursorPos = selected ? start + replacement.length : start + 2;
        break;
      case "numbered":
        replacement = `1. ${selected || "item"}`;
        cursorPos = selected ? start + replacement.length : start + 3;
        break;
      case "quote":
        replacement = `> ${selected || "quote"}`;
        cursorPos = selected ? start + replacement.length : start + 2;
        break;
      case "code":
        replacement = "```\n" + (selected || "code") + "\n```";
        cursorPos = selected ? start + replacement.length : start + 4;
        break;
      case "link":
        replacement = `[${selected || "text"}](url)`;
        cursorPos = selected ? start + replacement.length : start + 6;
        break;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }, [content]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "P") { e.preventDefault(); setPreviewMode((p) => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") { e.preventDefault(); formatText("bold"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "i") { e.preventDefault(); formatText("italic"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); formatText("link"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [save, formatText]);

  const applyTemplate = (categoryName: string) => {
    const cat = categories.find((c) => c.name === categoryName);
    if (cat?.template && !content.trim()) {
      setContent(cat.template);
    }
  };

  if (noteLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-hairline-strong border-t-primary" />
          <p className="text-body-sm text-slate">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="no-print flex items-center justify-between border-b border-hairline px-xl py-md">
          <div className="flex items-center gap-lg">
            <select
              value={currentCategory}
              onChange={(e) => {
                setCurrentCategory(e.target.value);
                applyTemplate(e.target.value);
              }}
              className="rounded-md bg-transparent px-1 py-0.5 text-body-sm text-ink outline-none border border-transparent hover:border-hairline focus:border-primary cursor-pointer"
            >
              {[...new Set([currentCategory, ...categories.map((c) => c.name)])].sort().map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-sm">
            <Button variant="ghost" onClick={() => setPreviewMode(!previewMode)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span className="hidden md:inline">{previewMode ? "Edit" : "Preview"}</span>
            </Button>
            <Button variant="ghost" onClick={() => setAiSidebarOpen(!aiSidebarOpen)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span className="hidden md:inline">{aiSidebarOpen ? "Hide AI" : "AI Assist"}</span>
            </Button>
            <Button variant="secondary" onClick={save}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span className="hidden md:inline ml-1">Save</span>
            </Button>
            {noteId && (
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="inline-flex items-center justify-center rounded-md px-[10px] py-[10px] text-button-md text-steel hover:bg-surface hover:text-charcoal transition-colors"
                  title="More"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="12" cy="5" r="1"/>
                    <circle cx="12" cy="19" r="1"/>
                  </svg>
                  <span className="hidden md:inline ml-1">More</span>
                </button>
                {showMore && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-hairline bg-canvas shadow-modal">
                    <button
                      onClick={() => { toggleShare(); setShowMore(false); }}
                      disabled={sharing}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-body-sm text-ink hover:bg-surface rounded-t-lg"
                    >
                      <span>Share</span>
                      <span className={`text-body-xs font-medium ${shareOn ? "text-brand-green" : "text-muted"}`}>
                        {shareOn ? "On" : "Off"}
                      </span>
                    </button>
                    {shareOn && shareSlug && (
                      <button
                        onClick={() => { copyShareLink(); setShowMore(false); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-body-xs text-primary hover:bg-surface"
                      >
                        {copied ? "Copied!" : "Copy link"}
                      </button>
                    )}
                    <button onClick={() => { exportPDF(); setShowMore(false); }} className="flex w-full items-center px-3 py-2 text-body-sm text-ink hover:bg-surface">
                      Export PDF
                    </button>
                    <button onClick={() => { exportDOCX(); setShowMore(false); }} className="flex w-full items-center px-3 py-2 text-body-sm text-ink hover:bg-surface">
                      Export DOCX
                    </button>
                    <div className="mx-3 h-px bg-hairline" />
                    <button
                      onClick={() => { if (confirm("Move this note to trash?")) { deleteNote(); } setShowMore(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-semantic-error hover:bg-semantic-error/10 rounded-b-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-xl">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-lg w-full border-0 bg-transparent text-heading-3 text-charcoal outline-none placeholder:text-muted"
            placeholder="Note title..."
          />
          {!previewMode && (
            <div className="no-print flex items-center gap-0.5 border-b border-hairline px-md pb-sm">
              <button onClick={() => formatText("bold")} className="flex h-7 w-7 items-center justify-center rounded-sm text-sm font-bold text-steel hover:bg-surface hover:text-charcoal transition-colors" title="Bold">B</button>
              <button onClick={() => formatText("italic")} className="flex h-7 w-7 items-center justify-center rounded-sm text-sm italic text-steel hover:bg-surface hover:text-charcoal transition-colors" title="Italic">I</button>
              <span className="mx-1 h-4 w-px bg-hairline" />
              <button onClick={() => formatText("heading")} className="flex h-7 w-7 items-center justify-center rounded-sm text-xs font-bold text-steel hover:bg-surface hover:text-charcoal transition-colors" title="Heading">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>
              </button>
              <button onClick={() => formatText("bullet")} className="flex h-7 w-7 items-center justify-center rounded-sm text-sm text-steel hover:bg-surface hover:text-charcoal transition-colors" title="Bullet list">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
              <button onClick={() => formatText("numbered")} className="flex h-7 w-7 items-center justify-center rounded-sm text-sm text-steel hover:bg-surface hover:text-charcoal transition-colors" title="Numbered list">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
              </button>
              <button onClick={() => formatText("quote")} className="flex h-7 w-7 items-center justify-center rounded-sm text-sm text-steel hover:bg-surface hover:text-charcoal transition-colors" title="Quote">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
              </button>
              <button onClick={() => formatText("code")} className="flex h-7 w-7 items-center justify-center rounded-sm font-mono text-sm text-steel hover:bg-surface hover:text-charcoal transition-colors" title="Code block">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </button>
              <button onClick={() => formatText("link")} className="flex h-7 w-7 items-center justify-center rounded-sm text-sm text-steel hover:bg-surface hover:text-charcoal transition-colors" title="Link">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </button>
            </div>
          )}
          {previewMode ? (
            <div className="prose prose-sm max-w-none text-ink">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*Empty note*"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] w-full resize-none border-0 bg-transparent text-body-md text-ink outline-none placeholder:text-muted"
              placeholder="Start writing your notes..."
            />
          )}
        </div>

        {actionError && (
          <div className="no-print border-t border-hairline px-xl py-sm text-body-sm text-semantic-error">
            {actionError}
          </div>
        )}
        <div className="no-print flex items-center gap-sm border-t border-hairline px-xl py-md text-body-sm text-stone">
          <span>{isDirty ? "Unsaved changes" : noteId ? "Saved" : "Draft — not saved"}</span>
          <span className="text-hairline-strong">|</span>
          <span>{wordCount} words</span>
          {noteTags.length > 0 && (
            <>
              <span className="text-hairline-strong">|</span>
              <div className="flex items-center gap-1">
                {noteTags.map((t) => (
                  <span key={t.id} className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: t.color + "20", color: t.color }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {aiSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/20 md:hidden"
            onClick={() => setAiSidebarOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-30 flex h-full w-[85vw] max-w-[320px] flex-col border-l border-hairline bg-canvas md:relative md:flex md:w-[320px]">
            <div className="flex items-center justify-between border-b border-hairline px-lg py-md">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 4s-4-2-4-4 2-4 4-4z"/>
                  <path d="M12 14c4.418 0 8 1.79 8 4v2H4v-2c0-2.21 3.582-4 8-4z"/>
                </svg>
                <h3 className="text-body-md font-medium text-charcoal">AI Assistant</h3>
              </div>
              <button
                onClick={() => setAiSidebarOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-steel hover:bg-surface hover:text-charcoal transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-lg py-md">
              <div className="mb-lg">
                <p className="mb-md text-body-xs uppercase tracking-wide text-muted">Quick Actions</p>
                <div className="flex flex-wrap gap-sm">
                  <button
                    onClick={() => runAI("summarize")}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-body-sm text-ink hover:bg-surface disabled:opacity-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    Summarize
                  </button>
                  <button
                    onClick={() => runAI("quiz")}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-body-sm text-ink hover:bg-surface disabled:opacity-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Quiz
                  </button>
                  <button
                    onClick={() => runAI("explain")}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-body-sm text-ink hover:bg-surface disabled:opacity-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4"/>
                      <path d="M12 8h.01"/>
                    </svg>
                    Explain
                  </button>
                  <button
                    onClick={() => runAI("paraphrase")}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-body-sm text-ink hover:bg-surface disabled:opacity-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6h16"/>
                      <path d="M4 12h8"/>
                      <path d="M4 18h12"/>
                    </svg>
                    Paraphrase
                  </button>
                </div>
              </div>

              <div className="mb-lg">
                <p className="mb-md text-body-xs uppercase tracking-wide text-muted">Custom Question</p>
                <div className="flex items-center gap-2">
                  <input
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runAsk(); } }}
                    className="flex-1 rounded-lg border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink outline-none placeholder:text-muted focus:border-primary transition-colors"
                    placeholder="Ask anything about your notes..."
                  />
                  <button
                    onClick={runAsk}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-lg">
                <p className="mb-md text-body-xs uppercase tracking-wide text-muted">Tags</p>
                {noteTags.length > 0 && (
                  <div className="flex flex-wrap gap-sm mb-sm">
                    {noteTags.map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-body-xs font-medium"
                        style={{ backgroundColor: t.color + "20", color: t.color }}>
                        {t.name}
                        <button onClick={() => removeTagFromNote(t.id)} className="hover:opacity-60">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
                {showTagInput ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={tagInputValue}
                      onChange={(e) => setTagInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); createAndAddTag(); }
                        if (e.key === "Escape") { setShowTagInput(false); setTagInputValue(""); }
                      }}
                      placeholder="Tag name..."
                      className="flex-1 rounded-md border border-hairline bg-canvas px-2 py-1 text-body-xs text-ink outline-none focus:border-primary"
                      autoFocus
                    />
                    <button onClick={createAndAddTag} className="rounded-md bg-primary px-2 py-1 text-body-xs font-medium text-on-dark">Add</button>
                    <button onClick={() => { setShowTagInput(false); setTagInputValue(""); }} className="text-body-xs text-muted hover:text-charcoal">&times;</button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-sm">
                    {userTags
                      .filter((t) => !noteTags.some((nt) => nt.id === t.id))
                      .slice(0, 5)
                      .map((t) => (
                        <button key={t.id} onClick={() => addTagToNote(t.id)}
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-body-xs text-muted border border-hairline hover:bg-surface hover:text-charcoal transition-colors">
                          + {t.name}
                        </button>
                      ))}
                    <button onClick={() => setShowTagInput(true)}
                      className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-body-xs text-primary hover:bg-primary/10 transition-colors">
                      + New
                    </button>
                  </div>
                )}
              </div>

              {(aiResult || aiLoading) && (
                <div>
                  <div className="mb-md flex items-center justify-between">
                    <p className="text-body-xs uppercase tracking-wide text-muted">Response</p>
                    <div className="flex items-center gap-1">
                      {aiResult && !aiLoading && (
                        <>
                          <button
                            onClick={() => navigator.clipboard.writeText(aiResult)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-body-xs text-steel hover:bg-surface hover:text-charcoal transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                            Copy
                          </button>
                          <button
                            onClick={() => setContent((prev) => prev + "\n\n" + aiResult)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-body-xs text-steel hover:bg-surface hover:text-charcoal transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 3h5v5"/>
                              <path d="M8 3H3v5"/>
                              <path d="M3 8v5"/>
                              <path d="M21 8v5"/>
                              <path d="M8 21H3v-5"/>
                              <path d="M16 21h5v-5"/>
                            </svg>
                            Apply
                          </button>
                        </>
                      )}
                      {aiLoading && (
                        <span className="text-body-xs text-muted animate-pulse">Generating...</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-hairline bg-canvas p-md">
                    <div className="prose prose-sm max-w-none text-ink max-h-[400px] overflow-y-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult || "*Generating...*"}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
