"use client";

import { usePathname } from "next/navigation";
import { useSidebar } from "@/lib/sidebar-context";

const publicPages = ["/", "/login", "/register"];

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open } = useSidebar();
  const isPublic = publicPages.includes(pathname) || pathname.startsWith("/share");

  if (isPublic) {
    return <main className="flex-1 h-full max-w-full overflow-x-hidden overflow-y-auto w-full">{children}</main>;
  }

  return (
    <main className={`flex-1 h-full max-w-full overflow-x-hidden overflow-y-auto w-full pt-12 transition-all duration-200 ${
      open ? "md:ml-[240px]" : "md:ml-0"
    }`}>{children}</main>
  );
}
