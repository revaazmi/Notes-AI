"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface Reply {
  role: "admin" | "user";
  message: string;
  createdAt: string;
}

interface Report {
  id: string;
  message: string;
  status: string;
  replies: string;
  adminReply: string | null;
  repliedAt: string | null;
  userReply: string | null;
  userRepliedAt: string | null;
  createdAt: string;
}

function parseReplies(report: Report): Reply[] {
  const arr = JSON.parse(report.replies || "[]");
  if (arr.length === 0) {
    if (report.adminReply) arr.push({ role: "admin", message: report.adminReply, createdAt: report.repliedAt || report.createdAt });
    if (report.userReply) arr.push({ role: "user", message: report.userReply, createdAt: report.userRepliedAt || report.createdAt });
  }
  return arr;
}

const statusStyles: Record<string, { label: string; dot: string; bg: string }> = {
  open:    { label: "Open",    dot: "bg-semantic-error", bg: "bg-semantic-error/10 text-semantic-error" },
  replied: { label: "Replied", dot: "bg-brand-green",    bg: "bg-brand-green/10 text-brand-green" },
  closed:  { label: "Closed",  dot: "bg-steel",          bg: "bg-surface text-steel" },
};

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState("");

  const handleFollowUp = async () => {
    if (!selected || !followUpText.trim()) return;
    setSendingFollowUp(true);
    setFollowUpError("");
    try {
      const res = await fetch(`/api/reports/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: followUpText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      setFollowUpText("");
      const newReply: Reply = { role: "user", message: followUpText.trim(), createdAt: new Date().toISOString() };
      const updateReport = (prev: Report) => {
        const r = JSON.parse(prev.replies || "[]");
        r.push(newReply);
        return { ...prev, replies: JSON.stringify(r), userReply: newReply.message, userRepliedAt: newReply.createdAt };
      };
      setReports((prev) => prev.map((r) => r.id === selected.id ? updateReport(r) : r));
      setSelected((prev) => prev ? updateReport(prev) : null);
    } catch (err) {
      setFollowUpError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSendingFollowUp(false);
    }
  };

  const deleteReport = async (id: string) => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      setError("Failed to delete report");
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReports(data);
        else setError("Failed to load reports");
      })
      .catch(() => setError("Failed to load reports"))
      .finally(() => setLoading(false));
    fetch("/api/reports/mark-read", { method: "POST" }).catch(() => {});
  }, [session]);

  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selected]);

  return (
    <AuthGuard>
      <div className="flex flex-col gap-section-sm p-xl max-w-2xl mx-auto w-full">
        <h1 className="typography-heading-2 text-charcoal">My Reports</h1>
        <div className="flex items-start gap-2 rounded-md bg-surface px-md py-sm text-body-xs text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Reports are automatically deleted after 7 days
        </div>
        <Link
          href="/report"
          className="self-start rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90"
        >
          Submit a Report
        </Link>

        {loading && <p className="text-body-md text-slate">Loading...</p>}
        {error && <p className="text-body-sm text-semantic-error">{error}</p>}

        {!loading && !error && reports.length === 0 && (
          <p className="text-body-md text-slate py-lg text-center">You haven&apos;t submitted any reports yet.</p>
        )}

        {!loading && reports.length > 0 && (
          <div className="flex flex-col gap-sm">
            {reports.map((r) => {
              const s = statusStyles[r.status] || statusStyles.open;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="rounded-lg border border-hairline bg-surface p-md text-left transition-shadow hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-ink truncate">{r.message}</p>
                      <p className="text-body-xs text-muted mt-1">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        onClick={(e) => { e.stopPropagation(); deleteReport(r.id); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); deleteReport(r.id); } }}
                        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded text-slate hover:bg-semantic-error/10 hover:text-semantic-error transition-colors ${deleting === r.id ? "opacity-30 pointer-events-none" : ""}`}
                        title="Delete report"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-xs font-medium ${s.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selected && (
          <>
            <div
              className="fixed inset-0 z-20 bg-black/20"
              onClick={() => setSelected(null)}
            />
            <aside className="fixed right-0 top-0 z-30 flex h-full w-[85vw] max-w-[400px] flex-col border-l border-hairline bg-canvas shadow-xl">
              <div className="flex items-start justify-between gap-md border-b border-hairline px-xl py-lg">
                <div className="flex items-center gap-2">
                  <h2 className="typography-heading-4 text-charcoal">Report</h2>
                  {(() => {
                    const s = statusStyles[selected.status] || statusStyles.open;
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-xs font-medium ${s.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="shrink-0 rounded-md p-1 text-slate hover:bg-surface hover:text-charcoal transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-xl flex flex-col gap-lg">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-body-xs text-muted">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">U</span>
                    You
                    <span>{new Date(selected.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="ml-7 rounded-lg bg-surface border border-hairline p-md">
                    <p className="text-body-sm text-ink whitespace-pre-wrap">{selected.message}</p>
                  </div>
                </div>

                {parseReplies(selected).map((reply, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-body-xs text-muted">
                      {reply.role === "admin" ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold">A</span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">U</span>
                      )}
                      {reply.role === "admin" ? "Admin" : "You"}
                      <span>{new Date(reply.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className={`ml-7 rounded-lg border border-hairline p-md ${reply.role === "admin" ? "bg-card-tint-lavender" : "bg-surface"}`}>
                      <p className="text-body-sm text-ink whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  </div>
                ))}

                {(() => {
                  const replies = parseReplies(selected);
                  const lastReply = replies[replies.length - 1];
                  if (selected.status === "replied" && (!lastReply || lastReply.role === "admin")) {
                    return (
                      <div className="border-t border-hairline pt-lg flex flex-col gap-md">
                        <p className="text-body-xs text-muted">Send a follow-up</p>
                        <textarea
                          value={followUpText}
                          onChange={(e) => setFollowUpText(e.target.value)}
                          placeholder="Type your reply..."
                          rows={3}
                          className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary resize-none"
                        />
                        {followUpError && <p className="text-body-xs text-semantic-error">{followUpError}</p>}
                        <button
                          onClick={handleFollowUp}
                          disabled={sendingFollowUp || !followUpText.trim()}
                          className="self-end rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {sendingFollowUp ? "Sending..." : "Send"}
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {selected.status === "closed" && (
                  <div className="border-t border-hairline pt-lg">
                    <p className="text-body-xs text-muted italic">This report is closed.</p>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
      </div>
    </AuthGuard>
  );
}
