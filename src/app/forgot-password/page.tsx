"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-section-sm p-xl">
        <h1 className="typography-heading-2 text-charcoal">Check your email</h1>
        <p className="text-body-md text-slate">
          If an account exists for <strong>{email}</strong>, we sent a password reset link.
        </p>
        <Link href="/login" className="text-link-blue hover:underline text-body-sm">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section-sm p-xl">
      <h1 className="typography-heading-2 text-charcoal">Forgot password</h1>
      <p className="text-body-md text-slate">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
        <div className="flex flex-col gap-1">
          <label className="text-body-sm text-slate">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-hairline bg-canvas px-md py-[10px] text-body-md text-ink outline-none transition-colors placeholder:text-muted focus:border-primary"
            placeholder="you@email.com"
            required
            autoFocus
            disabled={loading}
          />
        </div>

        {error && <p className="text-body-sm text-semantic-error">{error}</p>}

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="text-body-sm text-slate">
        Remember your password?{" "}
        <Link href="/login" className="text-link-blue hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
