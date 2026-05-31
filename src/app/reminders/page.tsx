"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useQueryClient } from "@tanstack/react-query";

interface Reminder {
  id: string;
  title: string;
  noteId: string | null;
  dueAt: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

function formatDate(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);

  if (days < 0) return "Overdue";
  if (days === 0) return "Today " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Tomorrow " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const priorityColors: Record<string, string> = {
  high: "bg-semantic-error",
  medium: "bg-semantic-warning",
  low: "bg-semantic-success",
};

const priorityLabels: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function RemindersPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [actionError, setActionError] = useState("");

  const { data: reminders, isLoading: loading, error } = useApi<Reminder[]>(["reminders-page"], "/api/reminders?limit=50");

  const create = async () => {
    if (!title.trim() || !dueAt) return;
    setActionError("");
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueAt: new Date(dueAt).toISOString(), priority }),
      });
      if (!res.ok) { const d = await res.json(); setActionError(d.error || "Failed to create"); return; }
      setTitle("");
      setDueAt("");
      setPriority("medium");
      qc.invalidateQueries({ queryKey: ["reminders-page"] });
    } catch {
      setActionError("Failed to create reminder");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this reminder?")) return;
    setActionError("");
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (!res.ok) { setActionError("Failed to delete"); return; }
      qc.invalidateQueries({ queryKey: ["reminders-page"] });
    } catch {
      setActionError("Failed to delete reminder");
    }
  };

  return (
    <AuthGuard>
    <div className="flex flex-col gap-section-sm p-xl">
      <div>
        <h1 className="typography-heading-2 text-charcoal">Reminders</h1>
        <p className="text-body-md text-slate">Manage your notes reminders.</p>
      </div>

      <Card variant="base" className="p-lg">
        <div className="flex flex-col gap-md">
          <h3 className="text-heading-5 text-charcoal">New Reminder</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-md">
            <div className="flex-1 flex flex-col gap-xs">
              <label className="text-body-sm text-stone">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-md py-[8px] text-body-md text-ink outline-none placeholder:text-muted focus:border-primary"
                placeholder="Reminder title..."
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm text-stone">Due</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="rounded-lg border border-hairline bg-canvas px-md py-[8px] text-body-md text-ink outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-body-sm text-stone">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}
                className="rounded-lg border border-hairline bg-canvas px-md py-[8px] text-body-md text-ink outline-none focus:border-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Button variant="primary" onClick={create} disabled={!title.trim() || !dueAt}>
              Add
            </Button>
          </div>
        </div>
      </Card>

      {actionError && (
        <div className="rounded-lg bg-surface p-lg text-center">
          <p className="text-body-sm text-semantic-error">{actionError}</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg bg-surface p-hero text-center">
          <p className="text-body-md text-semantic-error">Failed to load reminders</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-sm">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-surface p-lg">
              <div className="mb-xs h-5 w-1/2 rounded bg-hairline" />
              <div className="h-4 w-1/3 rounded bg-hairline" />
            </div>
          ))}
        </div>
      )}

      {!loading && (!reminders || reminders.length === 0) && (
        <div className="rounded-lg bg-surface p-hero text-center">
          <p className="text-body-md text-slate">No reminders yet. Add one above!</p>
        </div>
      )}

      {!loading && reminders && reminders.length > 0 && (
        <div className="flex flex-col gap-sm">
          {reminders.map((r) => (
            <Card key={r.id} variant="agent-tile" className="flex items-center gap-md">
              <div className={`h-2 w-2 shrink-0 rounded-full ${priorityColors[r.priority]}`} />
              <div className="flex-1">
                <div className="flex items-center gap-sm">
                  <p className="text-body-sm font-medium text-charcoal">{r.title}</p>
                  <Badge variant={r.priority === "high" ? "tag-purple" : r.priority === "medium" ? "tag-orange" : "tag-green"}>
                    {priorityLabels[r.priority]}
                  </Badge>
                </div>
                <p className="text-body-sm text-stone">{formatDate(r.dueAt)}</p>
              </div>
              <button
                onClick={() => remove(r.id)}
                className="text-body-sm text-steel hover:text-semantic-error transition-colors"
              >
                Delete
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
