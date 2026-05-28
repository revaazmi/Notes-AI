"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ReportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user;

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          email: isLoggedIn ? undefined : email.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit report");
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      router.push(isLoggedIn ? "/reports" : "/");
    }, 2000);
    return () => clearTimeout(timer);
  }, [done, router, isLoggedIn]);

  return (
    <div className="mx-auto w-full max-w-2xl p-xl">

      {done && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 flex items-center gap-2 rounded-lg bg-brand-green px-lg py-sm shadow-modal border border-hairline text-body-sm font-medium text-brand-green-900">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Report submitted successfully!
        </div>
      )}
      <Link
        href={isLoggedIn ? "/reports" : "/"}
        className="inline-flex items-center gap-1 text-body-sm text-slate hover:text-charcoal transition-colors mb-lg"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </Link>

      <h1 className="typography-heading-2 text-charcoal mb-xl">Report an Issue</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
        {!isLoggedIn && (
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-body-xs text-muted">
              Email <span className="text-muted">(optional — for us to reply)</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="message" className="text-body-xs text-muted">
            Message <span className="text-semantic-error">*</span>
          </label>
          <textarea
            id="message"
            placeholder={isLoggedIn ? "Describe your issue or feedback..." : "Describe your issue — e.g. login problem, email not received..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            required
            className="rounded-md border border-hairline bg-canvas px-md py-sm text-body-sm text-ink outline-none focus:border-primary resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-1 rounded-md bg-semantic-error/10 px-md py-sm text-body-xs text-semantic-error">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90 disabled:opacity-50 w-full"
        >
          {sending ? "Sending..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
