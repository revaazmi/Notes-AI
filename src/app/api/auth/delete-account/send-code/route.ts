import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { verificationTokens } from "@/db/schema";
import { eq, and, like } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { sendDeleteAccountCode } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success, retryAfter } = rateLimit(`delete-account-code:${ip}`, { max: 1, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }

    const email = session.user.email;

    // Hapus code delete-account yang lama
    await db.delete(verificationTokens).where(
      and(eq(verificationTokens.identifier, email), like(verificationTokens.token, "delete-account:%"))
    );

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await db.insert(verificationTokens).values({
      identifier: email,
      token: `delete-account:${code}`,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendDeleteAccountCode(email, code);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
