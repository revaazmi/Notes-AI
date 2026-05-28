"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 1) return { label: null, width: "0%", barColor: "", textColor: "" };
  if (score === 2) return { label: "Weak", width: "25%", barColor: "bg-semantic-error", textColor: "text-semantic-error" };
  if (score === 3) return { label: "Medium", width: "50%", barColor: "bg-yellow-500", textColor: "text-yellow-600" };
  if (score === 4) return { label: "Strong", width: "75%", barColor: "bg-green-500", textColor: "text-green-600" };
  return { label: "Very strong", width: "100%", barColor: "bg-green-500", textColor: "text-green-600" };
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) { setError("Missing reset token"); return; }
    if (!password || password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must include an uppercase letter"); return; }
    if (!/[0-9]/.test(password)) { setError("Password must include a number"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col gap-section-sm p-xl">
        <h1 className="typography-heading-2 text-charcoal">Invalid link</h1>
        <p className="text-body-md text-semantic-error">This reset link is missing or invalid.</p>
        <Link href="/forgot-password" className="text-link-blue hover:underline text-body-sm">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col gap-section-sm p-xl">
        <h1 className="typography-heading-2 text-charcoal">Password updated</h1>
        <p className="text-body-md text-slate">Your password has been reset successfully.</p>
        <Link
          href="/login"
          className="inline-flex self-start items-center justify-center rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section-sm p-xl">
      <h1 className="typography-heading-2 text-charcoal">Reset password</h1>
      <p className="text-body-md text-slate">Enter your new password.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
        <div className="flex flex-col gap-1">
          <label className="text-body-sm text-slate">New password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-md py-[10px] pr-10 text-body-md text-ink outline-none transition-colors placeholder:text-muted focus:border-primary"
              placeholder="At least 8 characters"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-steel hover:bg-surface hover:text-charcoal transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {password.length > 0 && strength.label && (
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.barColor}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`text-body-xs ${strength.textColor}`}>{strength.label}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-body-sm text-slate">Confirm new password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => { const val = e.target.value; setConfirmPassword(val); setConfirmError(val && val !== password ? "Passwords do not match" : ""); }}
              className={`w-full rounded-md border bg-canvas px-md py-[10px] pr-10 text-body-md text-ink outline-none transition-colors placeholder:text-muted focus:border-primary ${confirmError ? "border-semantic-error" : "border-hairline"}`}
              placeholder="Re-enter new password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-steel hover:bg-surface hover:text-charcoal transition-colors"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {confirmError && (
            <p className="text-body-xs text-semantic-error">{confirmError}</p>
          )}
        </div>

        {error && <p className="text-body-sm text-semantic-error">{error}</p>}

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
