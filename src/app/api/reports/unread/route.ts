import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const [row] = await db
      .select({ value: count() })
      .from(reports)
      .where(
        and(
          eq(reports.userId, session.user.id),
          eq(reports.status, "replied"),
          eq(reports.readByUser, false)
        )
      );

    return NextResponse.json({ count: row.value });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
