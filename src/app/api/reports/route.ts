import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success, retryAfter } = rateLimit(`report:${ip}`, { max: 3, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }

    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id || null;
    const name = session?.user?.name || "Guest";
    const email = session?.user?.email || body.email || null;

    await db.insert(reports).values({ userId, name, email, message });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 200);

    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, session.user.id))
      .orderBy(desc(reports.createdAt))
      .limit(limit);

    return NextResponse.json(userReports);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
