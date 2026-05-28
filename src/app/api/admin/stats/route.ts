import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, notes, categories, reminders } from "@/db/schema";
import { count, isNull, isNotNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [userCount] = await db.select({ value: count() }).from(users);
    const [noteCount] = await db.select({ value: count() }).from(notes).where(isNull(notes.deletedAt));
    const [trashCount] = await db.select({ value: count() }).from(notes).where(isNotNull(notes.deletedAt));
    const [catCount] = await db.select({ value: count() }).from(categories);
    const [remCount] = await db.select({ value: count() }).from(reminders);
    const [unverifiedCount] = await db
      .select({ value: count() })
      .from(users)
      .where(isNull(users.emailVerified));

    return NextResponse.json({
      totalUsers: userCount.value,
      totalNotes: noteCount.value,
      totalCategories: catCount.value,
      totalReminders: remCount.value,
      trashCount: trashCount.value,
      unverifiedCount: unverifiedCount.value,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
