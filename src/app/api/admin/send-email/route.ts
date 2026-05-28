import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getTransporter, FROM_EMAIL as FROM } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, subject, message } = body;

    if (!userId || !subject || !message) {
      return NextResponse.json({ error: "userId, subject, and message are required" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found or has no email" }, { status: 404 });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return NextResponse.json({ error: "SMTP not configured" }, { status: 500 });
    }

    await transporter.sendMail({
      from: FROM,
      to: user.email,
      subject: `[Littera] ${subject}`,
      html: `<p>Hi ${user.name || "there"},</p><p>${message.replace(/\n/g, "<br>")}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
