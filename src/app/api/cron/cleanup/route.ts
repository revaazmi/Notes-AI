import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports, notes } from "@/db/schema";
import { lt, and, isNotNull } from "drizzle-orm";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key || key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    const deletedReports = await db.delete(reports).where(lt(reports.createdAt, cutoff)).returning({ id: reports.id });

    const deletedNotes = await db
      .delete(notes)
      .where(and(isNotNull(notes.deletedAt), lt(notes.deletedAt, cutoff)))
      .returning({ id: notes.id });

    return NextResponse.json({
      success: true,
      deletedReports: deletedReports.length,
      deletedNotes: deletedNotes.length,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
