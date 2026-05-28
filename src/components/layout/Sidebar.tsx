"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSidebar } from "@/lib/sidebar-context";
import { useTheme } from "@/lib/theme-context";

const icons = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  newNote: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  ),
  allNotes: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  trash: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  admin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: icons.dashboard },
  { href: "/notes/new", label: "New Note", icon: icons.newNote },
  { href: "/notes", label: "All Notes", icon: icons.allNotes },
  { href: "/trash", label: "Trash", icon: icons.trash },
];

export function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebar();
  const { theme, toggle } = useTheme();
  const { data: session } = useSession();

  const publicPages = ["/", "/login", "/register"];
  if (publicPages.includes(pathname) || pathname.startsWith("/share")) return null;

  const user = session?.user;
  const initial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";
  const avatar = user?.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.image} alt="" className="h-9 w-9 rounded-full object-cover" />
  ) : (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card-tint-mint text-body-sm text-brand-green">
      {initial}
    </span>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Navigation sidebar"
        className={`fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-hairline bg-canvas transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-hairline px-md py-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-deep text-on-dark text-body-sm font-bold">
            L
          </div>
          <div>
            <div className="text-body-sm font-semibold text-charcoal">Littera</div>
            <div className="text-[11px] text-slate leading-tight mt-0.5">AI note for your ideas</div>
          </div>
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto p-sm pt-1.5 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`group flex items-center gap-3 rounded-md px-md py-[10px] text-body-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/5 text-charcoal border-l-2 border-primary"
                    : "text-steel hover:bg-surface hover:text-charcoal border-l-2 border-transparent"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
          {session?.user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={close}
              className={`group flex items-center gap-3 rounded-md px-md py-[10px] text-body-sm font-medium transition-all ${
                pathname === "/admin"
                  ? "bg-primary/5 text-charcoal border-l-2 border-primary"
                  : "text-steel hover:bg-surface hover:text-charcoal border-l-2 border-transparent"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                {icons.admin}
              </span>
              Admin
            </Link>
          )}
        </nav>

        <div className="border-t border-hairline px-md py-1 flex items-center justify-between gap-2 bg-surface-soft">
          <div className="flex items-center gap-3 rounded-md px-md py-[10px] text-body-sm font-medium text-steel">
            {avatar}
            <span className="inline truncate max-w-[100px]">
              {user?.name || user?.email || "Student User"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-md text-steel hover:bg-surface hover:text-charcoal transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </Link>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to sign out?")) {
                  signOut({ callbackUrl: "/" }).catch(() => {});
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-steel hover:bg-surface hover:text-charcoal transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="border-t border-hairline px-md pb-sm pt-xs flex items-center justify-between text-body-xs text-muted">
          <div className="flex items-center gap-2">
            <span>© 2026 Littera</span>
            <span className="text-hairline">|</span>
            <Link href="/report" onClick={close} className="text-steel hover:text-charcoal transition-colors">
              Report
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex h-6 w-6 items-center justify-center rounded text-steel hover:text-charcoal transition-colors"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            <a
              href="https://github.com/zaidanity/Notes-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-steel hover:text-charcoal transition-colors"
              title="GitHub"
              aria-label="GitHub"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
