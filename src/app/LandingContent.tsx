"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

const features = [
  {
    title: "AI-Powered Notes",
    description: "Summarize, quiz, explain, and paraphrase your notes instantly with Groq AI.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    title: "Markdown Editor",
    description: "Rich markdown editing with preview, formatting toolbar, and keyboard shortcuts.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    title: "Organize with Categories",
    description: "Categorize notes with templates, filter and search across all your content.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    title: "Reminders & Notifications",
    description: "Never miss a deadline with reminders, priority levels, and browser notifications.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
];

export function LandingContent() {
  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center justify-center px-lg md:px-xl py-section md:py-hero text-center">
        <span className="mb-md flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-display-lg text-on-dark">
          L
        </span>
        <h1 className="text-[40px] md:text-hero-display leading-tight md:leading-[1.05] font-semibold text-charcoal mb-sm max-w-2xl">
          Littera
        </h1>
        <p className="w-full typography-body-md md:text-body-lg text-slate mb-xl max-w-[32rem]">
          AI-powered note-taking platform. Capture ideas, stay organized, and learn smarter.
        </p>
        <div className="flex items-center gap-md">
          <Link href="/register">
            <Button variant="primary">Get Started Free</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Sign In</Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-lg md:gap-xl px-lg md:px-xl pb-section-lg md:pb-hero max-w-5xl mx-auto">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col gap-sm rounded-lg border border-hairline bg-surface p-lg md:p-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              {f.icon}
            </span>
            <h3 className="text-heading-5 font-semibold text-charcoal">{f.title}</h3>
            <p className="text-body-md text-slate">{f.description}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-hairline py-md px-lg flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-body-xs text-muted">
        <span>© 2026 Littera</span>
        <span className="text-hairline hidden sm:inline">|</span>
        <a
          href="https://github.com/zaidanity/Notes-AI"
          target="_blank"
          rel="noopener noreferrer"
          className="text-steel hover:text-charcoal transition-colors"
        >
          GitHub
        </a>
        <span className="text-hairline hidden sm:inline">|</span>
        <Link
          href="/report"
          className="text-steel hover:text-charcoal transition-colors"
        >
          Report an issue
        </Link>
      </footer>
    </div>
  );
}
