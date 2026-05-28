<div align="center">
  <br/>
  <h1>Littera Notes With AI</h1>
  <p>
    <strong>AI-powered note-taking platform for university students</strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4"/>
    <img src="https://img.shields.io/badge/Neon_Postgres-00E59B?style=flat-square&logo=neon&logoColor=white" alt="Neon Postgres"/>
    <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM"/>
    <img src="https://img.shields.io/badge/Groq_AI-F55036?style=flat-square&logo=groq&logoColor=white" alt="Groq AI"/>
    <img src="https://img.shields.io/badge/NextAuth_v5-000000?style=flat-square&logo=nextauth&logoColor=white" alt="NextAuth v5"/>
  </p>
  <br/>
</div>

---

> Take smarter notes. Get AI summaries, quizzes, explanations, and paraphrasing — all in one place.

## Features

| | Feature | Description |
|---|---|---|
| 📝 | Notes | Create, edit, delete with markdown preview |
| 🏷️ | Categories | Organize notes with custom categories and templates |
| ⏰ | Reminders | Set due reminders with priority levels |
| 🤖 | AI Assistant | Summarize, quiz, explain, paraphrase, or ask anything |
| 🔔 | Notifications | Browser notifications for due reminders (every 60s) |
| 🗑️ | Trash | Soft-delete notes with restore capability |
| 🗣️ | Reports & Feedback | Submit reports (guest/login), admin replies, email notifications |
| 🔐 | Auth | Email/password login, register, forgot/reset password, email verification |
| 👤 | Profile | Settings page to update name |
| 🌙 | Dark Mode | Full dark theme with persistent toggle |
| 🎨 | Design System | Custom tokens, typography, shadows, and component library |
| 📱 | Responsive | Mobile-first with slide sidebar navigation |
| 🔧 | Admin Panel | User management dashboard for admins |

## AI Assistant

Built-in AI tools powered by **Groq** (`llama-3.3-70b-versatile`):

| Action | What it does |
|--------|-------------|
| Summarize | Condense your notes into key points |
| Quiz | Generate practice questions from your content |
| Explain | Break down complex concepts simply |
| Paraphrase | Rewrite text for clarity and tone |
| Custom Ask | Ask anything about your notes |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, webpack) |
| Styling | Tailwind CSS v4 |
| Database | Neon Postgres + Drizzle ORM |
| Auth | NextAuth v5 (Credentials + JWT) |
| AI Engine | Groq SDK (llama-3.3-70b-versatile) |
| Markdown | react-markdown + remark-gfm |
| Email | Nodemailer + Gmail SMTP (verification, password reset) |
| Password | bcryptjs |
| Doc Export | docx (Word export) |
| PDF Export | Browser print API (PDF export) |
| Deployment | Vercel |

## Quick Start

```bash
# 1. Clone & install
npm install

# 2. Create .env.local with these variables:
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
GROQ_API_KEY="gsk_your_api_key_here"
AUTH_SECRET="your_auth_secret_here"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER="your.email@gmail.com"
SMTP_PASS="your_gmail_app_password"
EMAIL_FROM="Littera <your.email@gmail.com>"
APP_URL="http://localhost:3000"

# 3. Push database schema
npx drizzle-kit push

# 4. Start dev
npm run dev
```

Generate `AUTH_SECRET` with `npx auth secret`.

Open **http://localhost:3000**

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server — pushes schema + starts webpack |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run db:generate` | Generate SQL migration |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## Database

**Tables** (defined in `src/db/schema.ts`):

| Table | Purpose |
|-------|---------|
| `users` | User accounts (name, email, password hash, role, image) |
| `accounts` | OAuth/linked accounts (NextAuth adapter) |
| `sessions` | Session storage (NextAuth adapter) |
| `verification_tokens` | Email verification & password reset tokens |
| `notes` | Notes with title, content, category, soft-delete |
| `categories` | Categories with name and template |
| `reminders` | Reminders with title, due date, priority, linked to note |
| `reports` | User reports with admin reply, status tracking |
| `announcements` | Broadcast announcements |

## Project Structure

```
src/
  app/
    page.tsx          Landing page (public)
    dashboard/        Dashboard (recent notes, AI suggestions, reminders)
    layout.tsx        Root layout (SidebarProvider + Header + Sidebar + main)
    notes/            Note list, editor, new note
    categories/       Category management
    reminders/        Reminder management
    search/           Search with filters
    trash/            Soft-deleted notes (restore/delete permanently)
    settings/         User profile settings
    admin/            Admin panel (user management)
    login/            Sign in
    register/         Create account
    forgot-password/  Password reset request
    reset-password/   Password reset with token
    verify-email/     Email verification with token
    reports/          My Reports (user sees own reports + admin replies)
    api/
      auth/           NextAuth, register, forgot/reset password, verify email, resend-verification
      reports/        Submit report (guest or logged in)
      admin/
        reports/      List & reply to reports
        users/        User management
        send-email/   Send email to user
      notes/          CRUD + soft-delete
      notes/[id]/     Single note CRUD + restore
      categories/     CRUD
      reminders/      CRUD
      ai/             Summarize, quiz, explain, paraphrase
      ai/ask/         Custom AI question
      user/           PATCH name
      admin/users/    Admin list users
  components/
    ui/               Reusable: Button, Card, Badge, TextInput
    layout/           Header (mobile), Sidebar (desktop + mobile slide)
    features/         NoteEditor, NoteCard, AISuggestionCard, ReminderCard
  db/
    schema.ts         Drizzle schema (notes, categories, reminders, users, accounts, sessions, verification_tokens)
    index.ts          Neon DB connection
  lib/
    ai.ts             Groq AI client
    auth.ts           NextAuth config (Credentials + DrizzleAdapter + JWT)
    auth-guard.ts     Admin route guard helper
    sidebar-context.tsx  SidebarProvider + useSidebar hook
    useReminderNotifications.ts  Browser notification hook
    useDebounce.ts    Debounce hook for search
```

## API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account (with confirmPassword validation) |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password (with confirmPassword validation) |
| POST | `/api/auth/resend-verification` | Resend verification email |
| GET | `/api/auth/verify-email` | Verify email with token |
| GET / POST | `/api/notes` | List (with search, category, pagination) / Create |
| GET / PUT / DELETE | `/api/notes/[id]` | Read / Update / Soft-delete |
| PUT | `/api/notes/[id]/restore` | Restore from trash |
| GET / POST | `/api/categories` | List / Create |
| DELETE | `/api/categories/[id]` | Delete |
| GET / POST | `/api/reminders` | List / Create |
| DELETE | `/api/reminders/[id]` | Delete |
| POST | `/api/reports` | Submit report (guest or logged in) |
| GET | `/api/reports` | User's own reports (auth required) |
| GET | `/api/admin/reports` | List all reports (admin) |
| POST | `/api/admin/reports/[id]/reply` | Reply to report (admin) |
| POST | `/api/admin/users/[id]/verify` | Manual verify user email (admin) |
| POST | `/api/admin/send-email` | Send email to user (admin) |
| PATCH | `/api/user` | Update name |
| GET | `/api/admin/users` | List all users (admin only) |
| POST | `/api/ai/{summarize,quiz,explain,paraphrase}` | AI actions |
| POST | `/api/ai/ask` | Custom AI question |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `GROQ_API_KEY` | ✅ | Groq API key for AI features |
| `AUTH_SECRET` | ✅ | NextAuth encryption secret (generate with `npx auth secret`) |
| `SMTP_HOST` | ✅ | SMTP server host (`smtp.gmail.com`) |
| `SMTP_PORT` | ✅ | SMTP port (`587`) |
| `SMTP_USER` | ✅ | SMTP email / Gmail address |
| `SMTP_PASS` | ✅ | Gmail App Password |
| `EMAIL_FROM` | ✅ | Sender address (`"Littera <your.email@gmail.com>"`) |
| `APP_URL` | ✅ | App base URL (`http://localhost:3000` locally, production URL on Vercel) |

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push to GitHub and import project to Vercel
2. Set all environment variables in Vercel dashboard
3. Build command auto-runs `npx drizzle-kit push && next build`
