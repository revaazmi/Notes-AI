import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notes, reminders } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 200);

  try {
    const all = await db
      .select()
      .from(reminders)
      .where(isAdmin ? undefined : eq(reminders.userId, session.user.id))
      .orderBy(desc(reminders.createdAt))
      .limit(limit);
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let title: string;
  let dueAt: string;
  let noteId: string | null;
  let priority: string;
  try {
    const body = await request.json();
    title = typeof body.title === "string" ? body.title.trim() : "";
    dueAt = body.dueAt;
    noteId = typeof body.noteId === "string" ? body.noteId.trim() : null;
    priority = typeof body.priority === "string" ? body.priority : "medium";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "Title too long" }, { status: 400 });
  }
  if (!dueAt) {
    return NextResponse.json({ error: "Due date is required" }, { status: 400 });
  }
  const dueDate = new Date(dueAt);
  if (isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
  }
  const validPriorities = ["high", "medium", "low"];
  if (!validPriorities.includes(priority)) {
    priority = "medium";
  }
  if (noteId) {
    try {
      const [note] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)));
      if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    } catch {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  try {
    const [reminder] = await db
      .insert(reminders)
      .values({
        userId: session.user.id,
        title: title.trim(),
        noteId,
        dueAt: dueDate,
        priority,
      })
      .returning();
    return NextResponse.json(reminder, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
