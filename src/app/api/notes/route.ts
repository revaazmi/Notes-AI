import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notes, noteTags, tags } from "@/db/schema";
import { desc, count, isNull, isNotNull, and, eq, or, ilike, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const trashParam = url.searchParams.get("trash");
    const searchParam = url.searchParams.get("search");
    const categoryParam = url.searchParams.get("category");

    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

    const isTrash = trashParam === "true";
    const searchFilter = searchParam
      ? or(
          ilike(notes.title, `%${searchParam}%`),
          ilike(notes.content, `%${searchParam}%`),
          ilike(notes.category, `%${searchParam}%`)
        )
      : undefined;
    const categoryFilter = categoryParam
      ? eq(notes.category, categoryParam)
      : undefined;
    const filter = and(
      eq(notes.userId, session.user.id),
      isTrash ? isNotNull(notes.deletedAt) : isNull(notes.deletedAt),
      searchFilter,
      categoryFilter
    );

    const total = await db
      .select({ value: count() })
      .from(notes)
      .where(filter)
      .then((r) => r[0].value);

    const queryBase = db
      .select()
      .from(notes)
      .where(filter);

    let query = isTrash
      ? queryBase.orderBy(desc(notes.deletedAt))
      : queryBase.orderBy(desc(notes.pinned), desc(notes.updatedAt));
    query = query.limit(limit) as typeof query;
    if (offset > 0) query = query.offset(offset) as typeof query;

    const data = await query;

    let dataWithTags = data;
    if (data.length > 0 && !isTrash) {
      const noteIds = data.map((n) => n.id);
      const allNoteTags = await db
        .select({
          noteId: noteTags.noteId,
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(inArray(noteTags.noteId, noteIds));

      const tagMap: Record<string, { id: string; name: string; color: string }[]> = {};
      for (const nt of allNoteTags) {
        if (!tagMap[nt.noteId]) tagMap[nt.noteId] = [];
        tagMap[nt.noteId].push({ id: nt.id, name: nt.name, color: nt.color });
      }

      dataWithTags = data.map((n) => ({ ...n, tags: tagMap[n.id] || [] }));
    }

    return NextResponse.json({ data: dataWithTags, total });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let title: string;
  let content: string;
  let category: string;
  try {
    const body = await request.json();
    title = (typeof body.title === "string" ? body.title : "").trim().slice(0, 200);
    content = (typeof body.content === "string" ? body.content : "").trim().slice(0, 100000);
    category = (typeof body.category === "string" ? body.category : "General").trim().slice(0, 100);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const [note] = await db
      .insert(notes)
      .values({
        userId: session.user.id,
        title,
        content,
        category,
      })
      .returning();
    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
