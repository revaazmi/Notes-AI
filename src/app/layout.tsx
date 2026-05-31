import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/lib/query-provider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/lib/sidebar-context";
import { ThemeProvider, themeScript } from "@/lib/theme-context";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import { FloatingNewNoteButton } from "@/components/layout/FloatingNewNoteButton";
import { RootErrorBoundary } from "@/components/layout/RootErrorBoundary";
import { MainWrapper } from "@/components/layout/MainWrapper";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Littera",
  description: "AI-powered note-taking platform. Capture ideas, stay organized, and learn smarter.",
  manifest: "/manifest",
  icons: "/icon-512.svg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full flex" suppressHydrationWarning>
        <RootErrorBoundary>
          <SessionProvider>
            <QueryProvider>
              <ThemeProvider>
                <SidebarProvider>
                    <Header />
                    <Sidebar />
                    <ServiceWorkerRegister />
                    <FloatingNewNoteButton />
                    <MainWrapper>{children}</MainWrapper>
                </SidebarProvider>
              </ThemeProvider>
            </QueryProvider>
          </SessionProvider>
        </RootErrorBoundary>
      </body>
    </html>
  );
}
