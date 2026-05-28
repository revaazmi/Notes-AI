import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { sendReportReplyNotification } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const reply = typeof body.message === "string" ? body.message.trim() : "";

    if (!reply) {
      return NextResponse.json({ error: "Reply message is required" }, { status: 400 });
    }

    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id));

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const currentReplies = JSON.parse(report.replies || "[]");
    currentReplies.push({ role: "admin", message: reply, createdAt: new Date().toISOString() });

    await db
      .update(reports)
      .set({
        replies: JSON.stringify(currentReplies),
        repliedAt: new Date(),
        status: "replied",
        readByUser: false,
        ...(report.userReply ? { userReply: null, userRepliedAt: null } : {}),
      })
      .where(eq(reports.id, id));

    if (report.email && !report.userId) {
      try {
        await sendReportReplyNotification(report.email, report.name, report.message, reply);
      } catch {
        /* email notification is best-effort */
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
