import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const reply = typeof body.message === "string" ? body.message.trim() : "";

    if (!reply) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const report = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .then((r) => r[0] ?? null);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (report.status !== "replied") {
      return NextResponse.json({ error: "You can only reply after admin has responded" }, { status: 400 });
    }

    const currentReplies = JSON.parse(report.replies || "[]");
    const lastReply = currentReplies[currentReplies.length - 1];
    if (lastReply?.role === "user") {
      return NextResponse.json({ error: "Please wait for admin to respond" }, { status: 400 });
    }

    currentReplies.push({ role: "user", message: reply, createdAt: new Date().toISOString() });

    await db
      .update(reports)
      .set({ replies: JSON.stringify(currentReplies), userReply: reply, userRepliedAt: new Date() })
      .where(eq(reports.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .then((r) => r[0] ?? null);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(reports).where(eq(reports.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
