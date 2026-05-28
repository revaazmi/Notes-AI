"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const redirected = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated" && !redirected.current) {
      redirected.current = true;
      window.location.replace("/login");
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-section-sm p-xl h-full min-h-0 overflow-y-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-hairline" />
          <div className="h-5 w-72 rounded bg-hairline" />
          <div className="mt-lg grid grid-cols-1 md:grid-cols-3 gap-xl">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-surface p-xl">
                  <div className="mb-sm h-5 w-3/4 rounded bg-hairline" />
                  <div className="mb-sm h-4 w-full rounded bg-hairline" />
                  <div className="h-4 w-1/2 rounded bg-hairline" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
