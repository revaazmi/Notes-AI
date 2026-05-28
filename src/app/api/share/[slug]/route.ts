import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const [note] = await db
      .select({
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
      })
      .from(notes)
      .where(and(eq(notes.shareSlug, slug), eq(notes.isPublic, true), isNull(notes.deletedAt)));

    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
