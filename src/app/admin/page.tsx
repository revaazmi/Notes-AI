"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Stats {
  totalUsers: number;
  totalNotes: number;
  trashCount: number;
  unverifiedCount: number;
}

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  emailVerified: string | null;
  createdAt: string;
}

interface NoteRow {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
}

interface Reply {
  role: "admin" | "user";
  message: string;
  createdAt: string;
}

interface ReportRow {
  id: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  message: string;
  status: string;
  replies: string;
  adminReply: string | null;
  repliedAt: string | null;
  userReply: string | null;
  userRepliedAt: string | null;
  createdAt: string;
}

function parseReplies(r: ReportRow): Reply[] {
  const arr = JSON.parse(r.replies || "[]");
  if (arr.length === 0) {
    if (r.adminReply) arr.push({ role: "admin", message: r.adminReply, createdAt: r.repliedAt || r.createdAt });
    if (r.userReply) arr.push({ role: "user", message: r.userReply, createdAt: r.userRepliedAt || r.createdAt });
  }
  return arr;
}

interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  active: boolean;
  createdAt: string;
}

const statCards: { key: keyof Stats; label: string; color: string; tab?: "users" | "notes" | "reports" | "announcements" }[] = [
  { key: "totalUsers", label: "Total Users", color: "text-primary", tab: "users" },
  { key: "totalNotes", label: "Active Notes", color: "text-link-blue", tab: "notes" },
  { key: "trashCount", label: "Trashed Notes", color: "text-semantic-error", tab: "notes" },
  { key: "unverifiedCount", label: "Unverified Users", color: "text-steel", tab: "users" },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"users" | "notes" | "reports" | "announcements" | "appbuilds">("users");

  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userVerified, setUserVerified] = useState("");

  const [selectedNote, setSelectedNote] = useState<NoteRow | null>(null);
  const [noteSearch, setNoteSearch] = useState("");
  const [noteTrashed, setNoteTrashed] = useState("false");

  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [reportFilter, setReportFilter] = useState<"all" | "open" | "replied" | "closed">("all");
  const [reportSearch, setReportSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [emailUser, setEmailUser] = useState<UserRow | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const [announceSlide, setAnnounceSlide] = useState<AnnouncementRow | "create" | null>(null);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceContent, setAnnounceContent] = useState("");
  const [announceActive, setAnnounceActive] = useState(true);
  const [savingAnnounce, setSavingAnnounce] = useState(false);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (!res.ok) return;
    const data = await res.json();
    if (!data.error) setStats(data);
  }, []);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (userSearch) params.set("search", userSearch);
    if (userRole) params.set("role", userRole);
    if (userVerified) params.set("verified", userVerified);
    const res = await fetch(`/api/admin/users?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  }, [userSearch, userRole, userVerified]);

  const fetchNotes = useCallback(async () => {
    const params = new URLSearchParams();
    if (noteSearch) params.set("search", noteSearch);
    if (noteTrashed) params.set("trashed", noteTrashed);
    params.set("limit", "50");
    const res = await fetch(`/api/admin/notes?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setNotes(data);
  }, [noteSearch, noteTrashed]);

  const fetchReports = useCallback(async () => {
    const res = await fetch("/api/admin/reports");
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setReports(data);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch("/api/admin/announcements");
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setAnnouncements(data);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    /* eslint-disable react-hooks/set-state-in-effect */
    const fetchers: Promise<void>[] = [fetchStats(), fetchReports()];
    if (tab === "users") fetchers.push(fetchUsers());
    else if (tab === "notes") fetchers.push(fetchNotes());
    else if (tab === "announcements") fetchers.push(fetchAnnouncements());
    Promise.all(fetchers)
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [status, session, router, fetchStats, fetchUsers, fetchNotes, fetchReports, fetchAnnouncements, tab]);

  useEffect(() => {
    if (!selectedNote) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedNote(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedNote]);

  useEffect(() => {
    if (!selectedReport) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedReport(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedReport]);

  useEffect(() => {
    if (!emailUser) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setEmailUser(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [emailUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedUser(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedUser]);

  useEffect(() => {
    if (!announceSlide) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setAnnounceSlide(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [announceSlide]);

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col gap-section-sm p-xl">
        <h1 className="typography-heading-2 text-charcoal">Admin Panel</h1>
        <p className="text-body-md text-slate">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-section-sm p-xl">
        <h1 className="typography-heading-2 text-charcoal">Admin Panel</h1>
        <p className="text-body-sm text-semantic-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section-sm p-xl">
      <h1 className="typography-heading-2 text-charcoal">Admin Panel</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {statCards.map((s) => {
          const Wrapper = s.tab ? "button" : "div";
          return (
            <Wrapper
              key={s.key}
              onClick={s.tab ? () => {
                setTab(s.tab!);
                if (s.key === "unverifiedCount") { setUserVerified("false"); setUserRole(""); setUserSearch(""); }
                if (s.key === "trashCount") { setNoteTrashed("true"); setNoteSearch(""); }
              } : undefined}
              className={`flex flex-col gap-1 rounded-lg border border-hairline bg-canvas p-md ${s.tab ? "cursor-pointer text-left transition-shadow hover:shadow-card" : ""}`}
            >
              <span className="text-body-xs text-slate uppercase tracking-wide">{s.label}</span>
              <span className={`typography-heading-3 ${s.color}`}>
                {stats ? String(stats[s.key]) : "\u2014"}
              </span>
            </Wrapper>
          );
        })}
      </div>

      {reports.filter((r) => r.status === "open").length > 0 && (
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <h2 className="typography-heading-4 text-charcoal">Open Reports</h2>
            <button onClick={() => { setTab("reports"); setReportFilter("open"); }} className="text-body-sm text-link-blue hover:underline">
              View All
            </button>
          </div>
          <div className="flex flex-col gap-sm">
            {reports.filter((r) => r.status === "open").slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedReport(r); setReplyText(""); }}
                className="flex items-start justify-between gap-md rounded-lg border border-hairline bg-surface p-md text-left transition-shadow hover:shadow-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-body-xs text-muted">{r.name || "Guest"}{r.email ? ` (${r.email})` : ""}</p>
                  <p className="text-body-sm text-ink truncate mt-0.5">{r.message}</p>
                </div>
                <span className="shrink-0 rounded-full bg-semantic-error/10 px-2 py-0.5 text-body-xs font-medium text-semantic-error">
                  \u25CF {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2" role="tablist">
        {([
          { id: "users" as const, label: "Users", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
          { id: "notes" as const, label: "Notes", icon: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" },
          { id: "reports" as const, label: "Reports", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
          { id: "announcements" as const, label: "Announcements", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
          { id: "appbuilds" as const, label: "App Builds", icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-body-sm font-medium transition-all ${
              tab === t.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-hairline bg-canvas text-slate hover:border-steel hover:text-charcoal"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="flex flex-col gap-md">
          <div className="flex flex-wrap gap-sm">
            <input
              type="text"
              placeholder="Search name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="flex-1 min-w-[200px] rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
            />
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
            >
              <option value="">All roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={userVerified}
              onChange={(e) => setUserVerified(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
            >
              <option value="">All users</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          <div className="flex flex-col gap-sm md:hidden">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface p-md text-left transition-shadow hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-ink truncate">{u.name || "\u2014"}</p>
                    <p className="text-body-xs text-muted truncate">{u.email || "\u2014"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-body-xs font-medium ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-canvas text-steel"}`}>
                      {u.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 text-body-xs font-medium ${u.emailVerified ? "text-brand-green" : "text-semantic-error"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.emailVerified ? "bg-brand-green" : "bg-semantic-error"}`} />
                    {u.emailVerified ? "Verified" : "Unverified"}
                  </span>
                  <div className="flex items-center gap-1">
                    {!u.emailVerified && (
                      <button
                        onClick={(e) => { e.stopPropagation(); fetch(`/api/admin/users/${u.id}/verify`, { method: "POST" }).then(fetchUsers); }}
                        className="rounded-md bg-brand-green/10 px-2 py-1 text-body-xs font-medium text-brand-green"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEmailUser(u); setEmailSubject(""); setEmailMessage(""); }}
                      className="rounded-md bg-primary/10 px-2 py-1 text-body-xs font-medium text-primary"
                    >
                      Email
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-hairline text-slate">
                  <th className="py-sm pr-md font-medium">Name</th>
                  <th className="py-sm pr-md font-medium">Email</th>
                  <th className="py-sm pr-md font-medium">Role</th>
                  <th className="py-sm pr-md font-medium">Verified</th>
                  <th className="py-sm pr-md font-medium">Joined</th>
                  <th className="py-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-hairline text-ink cursor-pointer hover:bg-surface/50" onClick={() => setSelectedUser(u)}>
                    <td className="py-sm pr-md">{u.name || "\u2014"}</td>
                    <td className="py-sm pr-md">{u.email || "\u2014"}</td>
                    <td className="py-sm pr-md">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-body-xs font-medium ${
                        u.role === "admin" ? "bg-primary/10 text-primary" : "bg-surface text-steel"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-sm pr-md">
                      <span className={`inline-flex items-center gap-1 text-body-xs font-medium ${
                        u.emailVerified ? "text-brand-green" : "text-semantic-error"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.emailVerified ? "bg-brand-green" : "bg-semantic-error"}`} />
                        {u.emailVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="py-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-sm flex items-center gap-1">
                      {!u.emailVerified && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await fetch(`/api/admin/users/${u.id}/verify`, { method: "POST" });
                            fetchUsers();
                          }}
                          className="rounded-md bg-brand-green/10 px-2 py-1 text-body-xs font-medium text-brand-green hover:bg-brand-green/20 transition-colors"
                          title="Verify email"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEmailUser(u); setEmailSubject(""); setEmailMessage(""); }}
                        className="rounded-md bg-primary/10 px-2 py-1 text-body-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                        title="Send email"
                      >
                        Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-body-md text-slate py-lg text-center">No users found.</p>
            )}
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div className="flex flex-col gap-md">
          <div className="flex flex-wrap gap-sm">
            <input
              type="text"
              placeholder="Search title or content..."
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="flex-1 min-w-[200px] rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
            />
            <select
              value={noteTrashed}
              onChange={(e) => setNoteTrashed(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
            >
              <option value="false">Active notes</option>
              <option value="true">Trashed only</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="flex flex-col gap-sm md:hidden">
            {notes.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedNote(n)}
                className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface p-md text-left transition-shadow hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body-sm font-medium text-ink truncate flex-1">{n.title || "Untitled"}</p>
                  {n.deletedAt ? (
                    <span className="shrink-0 text-body-xs font-medium text-semantic-error">Trashed</span>
                  ) : (
                    <span className="shrink-0 text-body-xs font-medium text-brand-green">Active</span>
                  )}
                </div>
                <p className="text-body-xs text-muted">by {n.userName || n.userEmail || "\u2014"}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex rounded-full bg-card-tint-lavender px-2 py-0.5 text-body-xs font-medium text-brand-purple-800">
                    {n.category}
                  </span>
                  <span className="text-body-xs text-slate">{new Date(n.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-hairline text-slate">
                  <th className="py-sm pr-md font-medium">Title</th>
                  <th className="py-sm pr-md font-medium">User</th>
                  <th className="py-sm pr-md font-medium">Category</th>
                  <th className="py-sm pr-md font-medium">Updated</th>
                  <th className="py-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((n) => (
                  <tr key={n.id} className="border-b border-hairline text-ink cursor-pointer hover:bg-surface/50" onClick={() => setSelectedNote(n)}>
                    <td className="py-sm pr-md max-w-[200px] truncate">{n.title || "Untitled"}</td>
                    <td className="py-sm pr-md">{n.userName || n.userEmail || "\u2014"}</td>
                    <td className="py-sm pr-md">
                      <span className="inline-flex rounded-full bg-card-tint-lavender px-2 py-0.5 text-body-xs font-medium text-brand-purple-800">
                        {n.category}
                      </span>
                    </td>
                    <td className="py-sm pr-md text-slate text-body-xs">
                      {new Date(n.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-sm">
                      {n.deletedAt ? (
                        <span className="text-semantic-error text-body-xs font-medium">Trashed</span>
                      ) : (
                        <span className="text-brand-green text-body-xs font-medium">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {notes.length === 0 && (
              <p className="text-body-md text-slate py-lg text-center">No notes found.</p>
            )}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="flex flex-col gap-md">
          <div className="flex flex-wrap items-center gap-sm">
            {(["all", "open", "replied", "closed"] as const).map((f) => {
              const count = f === "all" ? reports.length : reports.filter((r) => r.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setReportFilter(f)}
                  className={`rounded-full px-3 py-1 text-body-xs font-medium transition-colors ${
                    reportFilter === f
                      ? "bg-primary text-on-dark"
                      : "bg-surface text-slate hover:text-charcoal"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                </button>
              );
            })}
            <input
              type="text"
              placeholder="Search reports..."
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              className="ml-auto min-w-[200px] rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-sm md:hidden">
            {reports
              .filter((r) => reportFilter === "all" || r.status === reportFilter)
              .filter((r) => {
                if (!reportSearch.trim()) return true;
                const q = reportSearch.toLowerCase();
                return r.message.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q);
              })
              .map((r) => {
                const statusClass = r.status === "open" ? "bg-semantic-error/10 text-semantic-error"
                  : r.status === "replied" ? "bg-brand-green/10 text-brand-green"
                  : "bg-surface text-steel";
                return (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedReport(r); setReplyText(""); }}
                    className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface p-md text-left transition-shadow hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-ink truncate">{r.name || "Guest"}</p>
                        {r.email && <p className="text-body-xs text-muted truncate">{r.email}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-body-xs font-medium ${statusClass}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-body-sm text-ink line-clamp-2">{r.message}</p>
                    <p className="text-body-xs text-muted">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </button>
                );
              })}
            {reports
              .filter((r) => reportFilter === "all" || r.status === reportFilter)
              .filter((r) => {
                if (!reportSearch.trim()) return true;
                const q = reportSearch.toLowerCase();
                return r.message.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q);
              }).length === 0 && (
              <p className="text-body-md text-slate py-lg text-center">No reports found.</p>
            )}
          </div>

          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-hairline text-slate">
                  <th className="py-sm pr-md font-medium">User</th>
                  <th className="py-sm pr-md font-medium">Message</th>
                  <th className="py-sm pr-md font-medium">Status</th>
                  <th className="py-sm pr-md font-medium">Replied</th>
                  <th className="py-sm font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {reports
                  .filter((r) => reportFilter === "all" || r.status === reportFilter)
                  .filter((r) => {
                    if (!reportSearch.trim()) return true;
                    const q = reportSearch.toLowerCase();
                    return r.message.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q);
                  })
                  .map((r) => (
                  <tr key={r.id} className="border-b border-hairline text-ink cursor-pointer hover:bg-surface/50" onClick={() => { setSelectedReport(r); setReplyText(""); }}>
                    <td className="py-sm pr-md">
                      <div className="flex flex-col">
                        <span className="text-ink">{r.name || "\u2014"}</span>
                        {r.email && <span className="text-body-xs text-muted">{r.email}</span>}
                      </div>
                    </td>
                    <td className="py-sm pr-md max-w-[300px] truncate">{r.message}</td>
                    <td className="py-sm pr-md">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-body-xs font-medium ${
                        r.status === "open" ? "bg-semantic-error/10 text-semantic-error"
                        : r.status === "replied" ? "bg-brand-green/10 text-brand-green"
                        : "bg-surface text-steel"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-sm pr-md text-body-xs text-muted">
                      {r.repliedAt ? new Date(r.repliedAt).toLocaleDateString() : "\u2014"}
                    </td>
                    <td className="py-sm text-body-xs text-muted">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.filter((r) => reportFilter === "all" || r.status === reportFilter).filter((r) => {
              if (!reportSearch.trim()) return true;
              const q = reportSearch.toLowerCase();
              return r.message.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q);
            }).length === 0 && (
              <p className="text-body-md text-slate py-lg text-center">No reports found.</p>
            )}
          </div>
        </div>
      )}

      {tab === "announcements" && (
        <div className="flex flex-col gap-md">
          <div className="flex justify-between items-center">
            <p className="text-body-sm text-slate">{announcements.length} announcement{announcements.length !== 1 ? "s" : ""}</p>
            <button
              onClick={() => { setAnnounceSlide("create"); setAnnounceTitle(""); setAnnounceContent(""); setAnnounceActive(true); }}
              className="rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90"
            >
              + New Announcement
            </button>
          </div>

          <div className="flex flex-col gap-sm md:hidden">
            {announcements.map((a) => (
              <div key={a.id} className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-body-sm font-medium text-ink flex-1">{a.title}</p>
                  <button
                    onClick={async () => {
                      await fetch(`/api/admin/announcements/${a.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ active: !a.active }),
                      });
                      fetchAnnouncements();
                    }}
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-xs font-medium transition-colors ${
                      a.active ? "bg-brand-green/10 text-brand-green" : "bg-surface text-slate"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${a.active ? "bg-brand-green" : "bg-steel"}`} />
                    {a.active ? "Active" : "Inactive"}
                  </button>
                </div>
                <p className="text-body-sm text-muted line-clamp-2">{a.content}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body-xs text-slate">{new Date(a.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setAnnounceSlide(a); setAnnounceTitle(a.title); setAnnounceContent(a.content); setAnnounceActive(a.active); }}
                      className="rounded-md bg-primary/10 px-2 py-1 text-body-xs font-medium text-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this announcement?")) return;
                        await fetch(`/api/admin/announcements/${a.id}`, { method: "DELETE" });
                        fetchAnnouncements();
                      }}
                      className="rounded-md bg-semantic-error/10 px-2 py-1 text-body-xs font-medium text-semantic-error"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-hairline text-slate">
                  <th className="py-sm pr-md font-medium">Title</th>
                  <th className="py-sm pr-md font-medium">Content</th>
                  <th className="py-sm pr-md font-medium">Active</th>
                  <th className="py-sm pr-md font-medium">Created</th>
                  <th className="py-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id} className="border-b border-hairline text-ink">
                    <td className="py-sm pr-md font-medium">{a.title}</td>
                    <td className="py-sm pr-md max-w-[300px] truncate text-muted">{a.content}</td>
                    <td className="py-sm pr-md">
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/announcements/${a.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ active: !a.active }),
                          });
                          fetchAnnouncements();
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-xs font-medium transition-colors ${
                          a.active ? "bg-brand-green/10 text-brand-green" : "bg-surface text-slate"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${a.active ? "bg-brand-green" : "bg-steel"}`} />
                        {a.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-sm pr-md text-body-xs text-muted">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-sm">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setAnnounceSlide(a); setAnnounceTitle(a.title); setAnnounceContent(a.content); setAnnounceActive(a.active); }}
                          className="rounded-md bg-primary/10 px-2 py-1 text-body-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this announcement?")) return;
                            await fetch(`/api/admin/announcements/${a.id}`, { method: "DELETE" });
                            fetchAnnouncements();
                          }}
                          className="rounded-md bg-semantic-error/10 px-2 py-1 text-body-xs font-medium text-semantic-error hover:bg-semantic-error/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {announcements.length === 0 && (
              <p className="text-body-md text-slate py-lg text-center">No announcements yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === "appbuilds" && (
        <AppBuildsTab />
      )}

      {selectedReport && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setSelectedReport(null)}
          />
          <aside className="fixed right-0 top-0 z-40 flex h-full w-[85vw] max-w-[420px] flex-col border-l border-hairline bg-canvas shadow-xl">
            <div className="flex items-center justify-between gap-md border-b border-hairline px-xl py-lg">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
                <h2 className="typography-heading-4 text-charcoal">Report</h2>
                {(() => {
                  const s = selectedReport.status === "open" ? { dot: "bg-semantic-error", label: "Open", bg: "bg-semantic-error/10 text-semantic-error" }
                    : selectedReport.status === "replied" ? { dot: "bg-brand-green", label: "Replied", bg: "bg-brand-green/10 text-brand-green" }
                    : { dot: "bg-steel", label: "Closed", bg: "bg-surface text-steel" };
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-body-xs font-medium ${s.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  );
                })()}
              </div>
              <button onClick={() => setSelectedReport(null)} className="shrink-0 rounded-md p-1 text-slate hover:bg-surface hover:text-charcoal transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-xl py-lg flex flex-col gap-lg">
              <div className="text-body-xs text-muted">
                <span className="font-medium text-steel">From:</span>{" "}
                <span className="text-ink">{selectedReport.name || "Guest"}</span>
                {selectedReport.email && <span className="text-muted"> ({selectedReport.email})</span>}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-body-xs text-muted">Reported</span>
                <div className="rounded-lg bg-surface border border-hairline p-md">
                  <p className="text-body-sm text-ink whitespace-pre-wrap">{selectedReport.message}</p>
                  <p className="text-body-xs text-muted mt-1">
                    {new Date(selectedReport.createdAt).toLocaleString("en-GB", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {parseReplies(selectedReport).map((reply, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-body-xs text-muted">
                    {reply.role === "admin" ? "Admin reply" : "User follow-up"}
                  </span>
                  <div className={`rounded-lg border border-hairline p-md ${reply.role === "admin" ? "bg-card-tint-lavender" : "bg-surface"}`}>
                    <p className="text-body-sm text-ink whitespace-pre-wrap">{reply.message}</p>
                    <p className="text-body-xs text-muted mt-1">
                      {new Date(reply.createdAt).toLocaleString("en-GB", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {selectedReport.status !== "closed" && (
              <div className="border-t border-hairline px-xl py-lg flex flex-col gap-md">
                <label className="text-body-xs text-muted">Reply</label>
                <textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary resize-none"
                />
                <div className="flex items-center justify-between gap-md flex-wrap">
                  {selectedReport.userId ? (
                    <button
                      onClick={async () => {
                        await fetch(`/api/admin/reports/${selectedReport.id}/close`, { method: "POST" });
                        setSelectedReport(null);
                        fetchReports();
                      }}
                      className="rounded-md bg-steel/10 px-lg py-sm text-body-sm font-medium text-steel hover:bg-steel/20 transition-colors"
                    >
                      Closed
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        await fetch(`/api/reports/${selectedReport.id}`, { method: "DELETE" });
                        setSelectedReport(null);
                        fetchReports();
                      }}
                      className="rounded-md bg-semantic-error/10 px-lg py-sm text-body-sm font-medium text-semantic-error hover:bg-semantic-error/20 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!replyText.trim()) return;
                      setSendingReply(true);
                      try {
                        await fetch(`/api/admin/reports/${selectedReport.id}/reply`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ message: replyText.trim() }),
                        });
                        setReplyText("");
                        setSelectedReport(null);
                        fetchReports();
                      } finally {
                        setSendingReply(false);
                      }
                    }}
                    disabled={sendingReply || !replyText.trim()}
                    className="rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {sendingReply ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      {emailUser && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setEmailUser(null)}
          />
          <aside className="fixed right-0 top-0 z-40 flex h-full w-[85vw] max-w-[420px] flex-col border-l border-hairline bg-canvas shadow-xl">
            <div className="flex items-center justify-between gap-md border-b border-hairline px-xl py-lg">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <h2 className="typography-heading-4 text-charcoal">Send Email</h2>
              </div>
              <button onClick={() => setEmailUser(null)} className="shrink-0 rounded-md p-1 text-slate hover:bg-surface hover:text-charcoal transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-xl py-lg flex flex-col gap-md">
              <div className="flex flex-col gap-1">
                <label className="text-body-xs text-muted">To</label>
                <p className="text-body-sm text-ink">
                  <span className="font-medium">{emailUser.name || "\u2014"}</span>
                  {emailUser.email && <span className="text-muted"> ({emailUser.email})</span>}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-body-xs text-muted">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Your issue has been resolved"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-body-xs text-muted">Message</label>
                <textarea
                  placeholder="Type your message..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={6}
                  className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-md border-t border-hairline px-xl py-lg">
              <button
                onClick={() => setEmailUser(null)}
                className="rounded-md px-lg py-sm text-body-sm font-medium text-slate hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!emailSubject.trim() || !emailMessage.trim()) return;
                  setSendingEmail(true);
                  try {
                    await fetch("/api/admin/send-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: emailUser.id, subject: emailSubject.trim(), message: emailMessage.trim() }),
                    });
                    setEmailUser(null);
                    setEmailSubject("");
                    setEmailMessage("");
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                className="rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
            </div>
          </aside>
        </>
      )}

      {selectedNote && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setSelectedNote(null)}
          />
          <aside className="fixed right-0 top-0 z-40 flex h-full w-[85vw] max-w-[500px] flex-col border-l border-hairline bg-canvas shadow-xl">
            <div className="flex items-start justify-between gap-md border-b border-hairline px-xl py-lg">
              <h2 className="typography-heading-3 text-charcoal flex-1 break-words">
                {selectedNote.title || "Untitled"}
              </h2>
              <button
                onClick={() => setSelectedNote(null)}
                className="shrink-0 rounded-md p-1 text-slate hover:bg-surface hover:text-charcoal transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-xl py-lg prose prose-sm max-w-none text-ink">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedNote.content || "*Empty note*"}
              </ReactMarkdown>
            </div>

            <div className="border-t border-hairline px-xl py-lg flex flex-wrap gap-x-lg gap-y-sm text-body-xs text-slate">
              <span><span className="font-medium text-steel">User:</span> {selectedNote.userName || selectedNote.userEmail || "\u2014"}</span>
              <span><span className="font-medium text-steel">Category:</span> {selectedNote.category}</span>
              <span><span className="font-medium text-steel">Created:</span> {new Date(selectedNote.createdAt).toLocaleString()}</span>
              <span><span className="font-medium text-steel">Updated:</span> {new Date(selectedNote.updatedAt).toLocaleString()}</span>
              <span>
                <span className="font-medium text-steel">Status:</span>{" "}
                {selectedNote.deletedAt ? (
                  <span className="text-semantic-error font-medium">Trashed</span>
                ) : (
                  <span className="text-brand-green font-medium">Active</span>
                )}
              </span>
            </div>
          </aside>
        </>
      )}

      {selectedUser && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setSelectedUser(null)}
          />
          <aside className="fixed right-0 top-0 z-40 flex h-full w-[85vw] max-w-[400px] flex-col border-l border-hairline bg-canvas shadow-xl">
            <div className="flex items-center justify-between gap-md border-b border-hairline px-xl py-lg">
              <h2 className="typography-heading-4 text-charcoal">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="shrink-0 rounded-md p-1 text-slate hover:bg-surface hover:text-charcoal transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-xl py-lg flex flex-col gap-lg">
              <div className="flex flex-col gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-body-lg">
                  {(selectedUser.name || selectedUser.email || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-body-md font-medium text-charcoal">{selectedUser.name || "\u2014"}</p>
                  <p className="text-body-sm text-muted">{selectedUser.email || "\u2014"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md rounded-lg bg-surface p-md text-body-sm">
                <div>
                  <p className="text-body-xs text-muted">Role</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-body-xs font-medium mt-1 ${
                    selectedUser.role === "admin" ? "bg-primary/10 text-primary" : "bg-canvas text-steel"
                  }`}>{selectedUser.role}</span>
                </div>
                <div>
                  <p className="text-body-xs text-muted">Verified</p>
                  <span className={`inline-flex items-center gap-1 text-body-xs font-medium mt-1 ${
                    selectedUser.emailVerified ? "text-brand-green" : "text-semantic-error"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.emailVerified ? "bg-brand-green" : "bg-semantic-error"}`} />
                    {selectedUser.emailVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-body-xs text-muted">Joined</p>
                  <p className="text-ink mt-1">{new Date(selectedUser.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                {!selectedUser.emailVerified && (
                  <button
                    onClick={async () => {
                      await fetch(`/api/admin/users/${selectedUser.id}/verify`, { method: "POST" });
                      setSelectedUser({ ...selectedUser, emailVerified: new Date().toISOString() });
                      fetchUsers();
                    }}
                    className="w-full rounded-md bg-brand-green/10 px-lg py-sm text-body-sm font-medium text-brand-green hover:bg-brand-green/20 transition-colors"
                  >
                    Verify Email
                  </button>
                )}
                <button
                  onClick={() => { setEmailUser(selectedUser); setEmailSubject(""); setEmailMessage(""); }}
                  className="w-full rounded-md bg-primary/10 px-lg py-sm text-body-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  Send Email
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {announceSlide && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setAnnounceSlide(null)}
          />
          <aside className="fixed right-0 top-0 z-40 flex h-full w-[85vw] max-w-[420px] flex-col border-l border-hairline bg-canvas shadow-xl">
            <div className="flex items-center justify-between gap-md border-b border-hairline px-xl py-lg">
              <h2 className="typography-heading-4 text-charcoal">
                {announceSlide === "create" ? "New Announcement" : "Edit Announcement"}
              </h2>
              <button onClick={() => setAnnounceSlide(null)} className="shrink-0 rounded-md p-1 text-slate hover:bg-surface hover:text-charcoal transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-xl py-lg flex flex-col gap-md">
              <div className="flex flex-col gap-1">
                <label className="text-body-xs text-muted">Title</label>
                <input
                  type="text"
                  placeholder="Announcement title"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-body-xs text-muted">Content</label>
                <textarea
                  placeholder="Write your announcement..."
                  value={announceContent}
                  onChange={(e) => setAnnounceContent(e.target.value)}
                  rows={8}
                  className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announceActive}
                  onChange={(e) => setAnnounceActive(e.target.checked)}
                  className="rounded border-hairline text-primary focus:ring-primary"
                />
                <span className="text-body-sm text-ink">Active</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-md border-t border-hairline px-xl py-lg">
              <button
                onClick={() => setAnnounceSlide(null)}
                className="rounded-md px-lg py-sm text-body-sm font-medium text-slate hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!announceTitle.trim() || !announceContent.trim()) return;
                  setSavingAnnounce(true);
                  try {
                    if (announceSlide === "create") {
                      await fetch("/api/admin/announcements", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title: announceTitle.trim(), content: announceContent.trim(), active: announceActive }),
                      });
                    } else {
                      await fetch(`/api/admin/announcements/${announceSlide.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title: announceTitle.trim(), content: announceContent.trim(), active: announceActive }),
                      });
                    }
                    setAnnounceSlide(null);
                    fetchAnnouncements();
                  } finally {
                    setSavingAnnounce(false);
                  }
                }}
                disabled={savingAnnounce || !announceTitle.trim() || !announceContent.trim()}
                className="rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {savingAnnounce ? "Saving..." : announceSlide === "create" ? "Create" : "Save"}
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function AppBuildsTab() {
  const [builds, setBuilds] = useState<{ id: string; version: string; fileName: string; fileSize: number; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchBuilds = useCallback(async () => {
    const res = await fetch("/api/admin/app-builds");
    if (res.ok) setBuilds(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBuilds();
  }, [fetchBuilds]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !version.trim()) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("version", version.trim());
    await fetch("/api/admin/app-builds", { method: "POST", body: fd });
    setVersion("");
    setFile(null);
    setUploading(false);
    fetchBuilds();
  };

  return (
    <div className="flex flex-col gap-md">
      <form onSubmit={handleUpload} className="flex flex-col gap-md rounded-lg border border-hairline bg-surface p-md">
        <h3 className="typography-heading-4 text-charcoal">Upload APK</h3>
        <div className="flex flex-col sm:flex-row gap-sm">
          <input
            type="text"
            placeholder="Version (e.g. 1.0.0)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="flex-1 rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
          />
          <input
            type="file"
            accept=".apk"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="flex-1 rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-body-xs file:font-medium file:text-on-dark"
          />
        </div>
        <button
          type="submit"
          disabled={uploading || !file || !version.trim()}
          className="self-start rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {loading && <p className="text-body-sm text-slate">Loading builds...</p>}

      {!loading && builds.length === 0 && (
        <p className="text-body-md text-slate py-lg text-center">No builds uploaded yet.</p>
      )}

      {!loading && builds.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead>
              <tr className="border-b border-hairline text-slate">
                <th className="py-sm pr-md font-medium">Version</th>
                <th className="py-sm pr-md font-medium">File</th>
                <th className="py-sm pr-md font-medium">Size</th>
                <th className="py-sm font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {builds.map((b) => (
                <tr key={b.id} className="border-b border-hairline text-ink">
                  <td className="py-sm pr-md font-medium">{b.version}</td>
                  <td className="py-sm pr-md text-muted">{b.fileName}</td>
                  <td className="py-sm pr-md text-muted">{(b.fileSize / 1024 / 1024).toFixed(1)} MB</td>
                  <td className="py-sm text-muted">{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}