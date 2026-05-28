import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const all = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt));

    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
