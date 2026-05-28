import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const emailParam = request.nextUrl.searchParams.get("email");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const [record] = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token));

    if (!record || record.expires < new Date()) {
      if (emailParam) {
        const [user] = await db
          .select({ emailVerified: users.emailVerified })
          .from(users)
          .where(eq(users.email, emailParam));
        if (user?.emailVerified) {
          return NextResponse.json({ success: true, alreadyVerified: true });
        }
      }
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, record.identifier));

    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, token));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
