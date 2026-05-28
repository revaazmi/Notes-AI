"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SharedNotePage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<{ title: string; content: string; createdAt: string } | null>(null);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/share/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load note"));
  }, [slug]);

  const handleDismiss = () => setDismissed(true);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-xl">
        <div className="text-center">
          <h1 className="typography-heading-2 text-charcoal mb-md">Not Found</h1>
          <p className="text-body-md text-slate">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-xl">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-hairline-strong border-t-primary" />
          <p className="text-body-md text-slate">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-xl py-xxl">
        <h1 className="typography-heading-2 text-charcoal mb-lg">{data.title}</h1>
        <div className="prose prose-sm max-w-none text-ink">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content || "*Empty note*"}</ReactMarkdown>
        </div>
        <p className="text-body-xs text-muted mt-xl">
          {new Date(data.createdAt).toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </p>
      </div>

      {!dismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-hairline bg-canvas">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-xl py-3">
            <p className="text-body-sm text-steel">Dibuat dengan Littera</p>
            <div className="flex items-center gap-3">
              <a
                href="/api/app-builds/latest"
                className="rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90"
              >
                Download
              </a>
              <button
                onClick={handleDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate hover:bg-surface hover:text-charcoal transition-colors"
                aria-label="Dismiss"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
