import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { ids, action, value } = body;

    if (!Array.isArray(ids) || ids.length === 0 || !action) {
      return NextResponse.json({ error: "ids[] and action required" }, { status: 400 });
    }

    const where = and(eq(notes.userId, session.user.id), inArray(notes.id, ids));

    switch (action) {
      case "pin":
        await db.update(notes).set({ pinned: value !== false, pinnedAt: value !== false ? new Date() : null }).where(where);
        break;
      case "delete":
        await db.update(notes).set({ deletedAt: new Date() }).where(where);
        break;
      case "category": {
        if (!value) return NextResponse.json({ error: "Category value required" }, { status: 400 });
        const cat = String(value).trim().slice(0, 100);
        await db.update(notes).set({ category: cat }).where(where);
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
