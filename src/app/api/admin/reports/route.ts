import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(request.nextUrl.searchParams.get("offset")) || 0, 0);

    const all = await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
