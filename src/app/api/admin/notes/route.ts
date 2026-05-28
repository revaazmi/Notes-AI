import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes, users } from "@/db/schema";
import { desc, ilike, eq, and, or, isNull, isNotNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const trashed = request.nextUrl.searchParams.get("trashed")?.trim();
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 200);

    const conditions = [];

    if (search) {
      conditions.push(
        or(ilike(notes.title, `%${search}%`), ilike(notes.content, `%${search}%`)),
      );
    }

    if (trashed === "true") {
      conditions.push(isNotNull(notes.deletedAt));
    } else if (trashed !== "all") {
      conditions.push(isNull(notes.deletedAt));
    }

    const query = db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        category: notes.category,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        deletedAt: notes.deletedAt,
        userId: notes.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(notes)
      .leftJoin(users, eq(notes.userId, users.id));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const all = await query.orderBy(desc(notes.updatedAt)).limit(limit);

    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
