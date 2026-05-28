import { NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const active = await db
      .select()
      .from(announcements)
      .where(eq(announcements.active, true))
      .orderBy(desc(announcements.createdAt));

    return NextResponse.json(active);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
