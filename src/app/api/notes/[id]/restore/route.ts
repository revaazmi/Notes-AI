import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";

  try {
    const { id } = await params;
    const [note] = await db
      .update(notes)
      .set({ deletedAt: null })
      .where(and(eq(notes.id, id), isAdmin ? undefined : eq(notes.userId, session.user.id)))
      .returning();
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
