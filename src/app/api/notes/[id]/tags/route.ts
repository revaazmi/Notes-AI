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

  try {
    const { id } = await params;
    const rows = await db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, id));

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const tagId = body.tagId as string;

    if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

    const [note] = await db
      .select({ userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, id));
    if (!note || note.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.insert(noteTags).values({ noteId: id, tagId }).onConflictDoNothing();
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const tagId = body.tagId as string;
    if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

    await db
      .delete(noteTags)
      .where(and(eq(noteTags.noteId, id), eq(noteTags.tagId, tagId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
