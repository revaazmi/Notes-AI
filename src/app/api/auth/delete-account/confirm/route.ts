import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, verificationTokens, accounts, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const code = body.code as string;
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const email = session.user.email;

    const [token] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, `delete-account:${code}`),
          gt(verificationTokens.expires, new Date())
        )
      );

    if (!token) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Hapus sessions + accounts + user (cascade handles notes, categories, reminders)
    await db.delete(sessions).where(eq(sessions.userId, session.user.id));
    await db.delete(accounts).where(eq(accounts.userId, session.user.id));
    await db.delete(users).where(eq(users.id, session.user.id));

    // Bersihin token yang udah dipake
    await db.delete(verificationTokens).where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, `delete-account:${code}`)
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
