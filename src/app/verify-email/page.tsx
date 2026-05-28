"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    const email = searchParams.get("email") || "";

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Something went wrong");
      });
  }, [token, searchParams]);

  if (!token) {
    return (
      <div className="flex flex-col gap-section-sm p-xl">
        <h1 className="typography-heading-2 text-charcoal">Email verification</h1>
        <p className="text-body-md text-semantic-error">Missing verification token.</p>
        <Link href="/" className="text-link-blue hover:underline text-body-sm">Go to home</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section-sm p-xl">
      <h1 className="typography-heading-2 text-charcoal">Email verification</h1>

      {status === "loading" && (
        <p className="text-body-md text-slate">Verifying your email...</p>
      )}

      {status === "success" && (
        <>
          <p className="text-body-md text-slate">Your email has been verified successfully.</p>
          <Link
            href="/login"
            className="inline-flex self-start items-center justify-center rounded-md bg-primary px-lg py-sm text-body-sm font-medium text-on-dark transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <p className="text-body-md text-semantic-error">{errorMsg}</p>
          <Link href="/" className="text-link-blue hover:underline text-body-sm">Go to home</Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
