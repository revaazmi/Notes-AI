"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Category {
  id: string;
  name: string;
  template: string;
  createdAt: string;
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCats)
      .catch(() => setError("Failed to load categories"))
      .finally(() => setLoading(false));
  }, [refresh]);

  const [actionError, setActionError] = useState("");

  const create = async () => {
    if (!name.trim()) return;
    setActionError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), template }),
      });
      if (!res.ok) { const d = await res.json(); setActionError(d.error || "Failed to create"); return; }
      setName("");
      setTemplate("");
      setRefresh((r) => r + 1);
    } catch {
      setActionError("Failed to create category");
    }
  };

  const remove = async (id: string) => {
    setActionError("");
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { setActionError("Failed to delete"); return; }
      setRefresh((r) => r + 1);
    } catch {
      setActionError("Failed to delete category");
    }
  };

  return (
    <AuthGuard>
    <div className="flex flex-col gap-section-sm p-xl">
      <div>
        <h1 className="typography-heading-2 text-charcoal">Categories</h1>
        <p className="text-body-md text-slate">Manage note categories and their templates.</p>
      </div>

      <Card variant="base" className="p-lg">
        <div className="flex flex-col gap-md">
          <h3 className="text-heading-5 text-charcoal">Add Category</h3>
          <div className="flex flex-col gap-sm">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-canvas px-md py-[8px] text-body-md text-ink outline-none placeholder:text-muted focus:border-primary"
              placeholder="Category name..."
            />
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-canvas px-md py-[8px] text-body-md text-ink outline-none placeholder:text-muted focus:border-primary min-h-[100px] resize-none"
              placeholder="Optional template content (when creating a note in this category)..."
            />
            <div className="flex justify-end">
              <Button variant="primary" onClick={create} disabled={!name.trim()}>
                Add Category
              </Button>
            </div>
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
          <p className="text-body-md text-semantic-error">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-sm">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-surface p-lg">
              <div className="mb-xs h-5 w-1/3 rounded bg-hairline" />
              <div className="h-4 w-2/3 rounded bg-hairline" />
            </div>
          ))}
        </div>
      )}

      {!loading && cats.length === 0 && (
        <div className="rounded-lg bg-surface p-hero text-center">
          <p className="text-body-md text-slate">No categories yet. Add one above!</p>
        </div>
      )}

      {!loading && cats.length > 0 && (
        <div className="flex flex-col gap-sm">
          {cats.map((cat) => (
            <Card key={cat.id} variant="agent-tile" className="flex items-center gap-md">
              <div className="flex-1">
                <div className="flex items-center gap-sm">
                  <Badge variant="tag-purple">{cat.name}</Badge>
                </div>
                {cat.template && (
                  <p className="mt-xs text-body-sm text-stone line-clamp-2">{cat.template}</p>
                )}
              </div>
              <button
                onClick={() => remove(cat.id)}
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
