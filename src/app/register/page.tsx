"use client";

import { useState, useMemo } from "react";
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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = () => {
    const errors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!email.includes("@")) errors.email = "Invalid email format";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Must be at least 8 characters";
    else if (!/[A-Z]/.test(password)) errors.password = "Must include an uppercase letter";
    else if (!/[0-9]/.test(password)) errors.password = "Must include a number";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, confirmPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-section-sm p-xl">
        <h1 className="typography-heading-2 text-charcoal">Check your email</h1>
        <p className="text-body-md text-slate">
          We sent a verification link to <strong>{email}</strong>. Click the link to activate your account, then sign in.
        </p>
        <div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section-sm p-xl">
      <div>
        <h1 className="typography-heading-2 text-charcoal">Create account</h1>
        <p className="text-body-md text-slate">Join Littera</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
        <div className="flex flex-col gap-1">
          <label className="text-body-sm text-slate">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }}
            className={`rounded-md border bg-canvas px-md py-[10px] text-body-md text-ink outline-none transition-colors placeholder:text-muted focus:border-primary ${
              fieldErrors.name ? "border-semantic-error" : "border-hairline"
            }`}
            placeholder="Your name"
            required
            autoFocus
            disabled={loading}
          />
          {fieldErrors.name && (
            <p className="text-body-xs text-semantic-error">{fieldErrors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-body-sm text-slate">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
            className={`rounded-md border bg-canvas px-md py-[10px] text-body-md text-ink outline-none transition-colors placeholder:text-muted focus:border-primary ${
              fieldErrors.email ? "border-semantic-error" : "border-hairline"
            }`}
            placeholder="you@email.com"
            required
            disabled={loading}
          />
          {fieldErrors.email && (
            <p className="text-body-xs text-semantic-error">{fieldErrors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-body-sm text-slate">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
              className={`w-full rounded-md border bg-canvas px-md py-[10px] pr-10 text-body-md text-ink outline-none transition-colors placeholder:text-muted focus:border-primary ${
                fieldErrors.password ? "border-semantic-error" : "border-hairline"
              }`}
              placeholder="At least 8 characters"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-steel hover:bg-surface hover:text-charcoal transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
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
            <div className="flex flex-col gap-0.5">
              <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.barColor}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`text-body-xs ${strength.textColor}`}>{strength.label}</p>
            </div>
          )}

          {fieldErrors.password && (
            <p className="text-body-xs text-semantic-error">{fieldErrors.password}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-body-sm text-slate">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => { const val = e.target.value; setConfirmPassword(val); setFieldErrors((p) => ({ ...p, confirmPassword: val && val !== password ? "Passwords do not match" : undefined })); }}
              className={`w-full rounded-md border bg-canvas px-md py-[10px] pr-10 text-body-md text-ink outline-none transition-colors placeholder:text-muted focus:border-primary ${
                fieldErrors.confirmPassword ? "border-semantic-error" : "border-hairline"
              }`}
              placeholder="Re-enter password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-steel hover:bg-surface hover:text-charcoal transition-colors"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              tabIndex={-1}
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
          {fieldErrors.confirmPassword && (
            <p className="text-body-xs text-semantic-error">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {error && (
          <p className="text-body-sm text-semantic-error">{error}</p>
        )}

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account...
            </span>
          ) : "Create account"}
        </Button>
      </form>

      <p className="text-body-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="text-link-blue hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
