"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/lib/sidebar-context";
import { useApi } from "@/lib/use-api";
import { useReminderNotifications, getActiveCount } from "@/lib/useReminderNotifications";

interface Reminder {
  id: string;
  title: string;
  dueAt: string;
  priority: string;
}

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggle } = useSidebar();

  const show = session?.user && pathname !== "/" && pathname !== "/login" && pathname !== "/register" && !pathname.startsWith("/share");

  const { data: remindersData } = useApi<Reminder[]>(["header-reminders"], "/api/reminders?limit=50", !!show);
  const { data: unreadData } = useApi<{ count: number }>(["unread-reports"], "/api/reports/unread", !!show);

  const reminders = remindersData || [];
  const unreadReports = unreadData?.count || 0;

  useReminderNotifications(reminders);
  const activeCount = getActiveCount(reminders);

  if (!show) return null;

  return (
    <header className="fixed left-0 top-0 z-30 flex h-12 w-full items-center justify-between border-b border-hairline bg-canvas px-3">
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink hover:bg-surface"
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <Link href="/dashboard" className="text-body-md font-medium text-ink hover:text-primary transition-colors">Littera</Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/reports"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink hover:bg-surface"
          aria-label="Reports"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          {unreadReports > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-semantic-error px-0.5 text-[9px] font-medium text-white">
              {unreadReports > 9 ? "9+" : unreadReports}
            </span>
          )}
        </Link>
        <Link
          href="/search"
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink hover:bg-surface"
          aria-label="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </Link>
        <Link
          href="/reminders"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink hover:bg-surface"
          aria-label="Reminders"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {activeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-semantic-error px-0.5 text-[9px] font-medium text-white">
              {activeCount > 9 ? "9+" : activeCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
