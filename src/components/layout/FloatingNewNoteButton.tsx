"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingNewNoteButton() {
  const pathname = usePathname();

  const publicPages = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
  const isHidden =
    publicPages.includes(pathname) ||
    pathname.startsWith("/notes/") ||
    pathname.startsWith("/share");

  if (isHidden) return null;

  return (
    <Link
      href="/notes/new"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-dark shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label="New note"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </Link>
  );
}
