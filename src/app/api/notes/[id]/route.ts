import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notes, noteTags, tags } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";

  try {
    const { id } = await params;
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), isAdmin ? undefined : eq(notes.userId, session.user.id)));
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const noteTagsList = await db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, note.id));

    return NextResponse.json({ ...note, tags: noteTagsList });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";
  const { id } = await params;
  let title: string | undefined;
  let content: string | undefined;
  let category: string | undefined;
  let isPublic: boolean | undefined;
  let pinned: boolean | undefined;
  try {
    const body = await request.json();
    title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : undefined;
    content = typeof body.content === "string" ? body.content.trim().slice(0, 100000) : undefined;
    category = typeof body.category === "string" ? body.category.trim().slice(0, 100) : undefined;
    isPublic = typeof body.isPublic === "boolean" ? body.isPublic : undefined;
    pinned = typeof body.pinned === "boolean" ? body.pinned : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updateFields.title = title;
  if (content !== undefined) updateFields.content = content;
  if (category !== undefined) updateFields.category = category;
  if (isPublic !== undefined) updateFields.isPublic = isPublic;
  if (pinned !== undefined) {
    updateFields.pinned = pinned;
    updateFields.pinnedAt = pinned ? new Date() : null;
  }
  if (Object.keys(updateFields).length === 1) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  try {
    const [note] = await db
      .update(notes)
      .set(updateFields)
      .where(and(eq(notes.id, id), isAdmin ? undefined : eq(notes.userId, session.user.id)))
      .returning();
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";

  try {
    const { id } = await params;
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";
    if (permanent) {
      await db
        .delete(notes)
        .where(and(eq(notes.id, id), isAdmin ? undefined : eq(notes.userId, session.user.id)));
    } else {
      await db
        .update(notes)
        .set({ deletedAt: new Date() })
        .where(and(eq(notes.id, id), isAdmin ? undefined : eq(notes.userId, session.user.id)));
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
