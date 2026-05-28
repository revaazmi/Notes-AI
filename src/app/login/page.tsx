"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(urlError ? "Invalid email or password" : "");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.replace(callbackUrl);
    }
  }, [status, callbackUrl]);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-section-sm p-xl">
        <div className="h-8 w-48 rounded bg-hairline animate-pulse" />
        <div className="h-5 w-72 rounded bg-hairline animate-pulse mt-md" />
      </div>
    );
  }

  if (status === "authenticated") return null;

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!email.includes("@")) errors.email = "Invalid email format";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Must be at least 8 characters";
    else if (!/[A-Z]/.test(password)) errors.password = "Must include an uppercase letter";
    else if (!/[0-9]/.test(password)) errors.password = "Must include a number";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
      setLoading(false);
    } else if (res?.url) {
      window.location.replace(res.url);
    } else {
      window.location.replace(callbackUrl);
    }
  };

  return (
    <div className="flex flex-col gap-section-sm p-xl">
      <div>
        <h1 className="typography-heading-2 text-charcoal">Welcome back</h1>
        <p className="text-body-md text-slate">Sign in to Littera</p>
      </div>

      <form onSubmit={handleCredentials} className="flex flex-col gap-md" noValidate>
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
            autoFocus
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
              placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
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
          {fieldErrors.password && (
            <p className="text-body-xs text-semantic-error">{fieldErrors.password}</p>
          )}
          <Link href="/forgot-password" className="text-body-xs text-link-blue hover:underline self-end -mt-0.5">
            Forgot password?
          </Link>
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
              Signing in...
            </span>
          ) : "Sign in"}
        </Button>
      </form>

      <p className="text-body-sm text-slate">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-link-blue hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
