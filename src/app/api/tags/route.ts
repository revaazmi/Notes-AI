import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 100, 200);

  const userTags = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, session.user.id))
    .orderBy(asc(tags.name))
    .limit(limit);

  return NextResponse.json(userTags);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let name: string;
  let color: string;
  try {
    const body = await request.json();
    name = (typeof body.name === "string" ? body.name : "").trim().slice(0, 50);
    color = typeof body.color === "string" ? body.color.trim() : "#6C4CE0";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const [tag] = await db
      .insert(tags)
      .values({ userId: session.user.id, name, color })
      .returning();
    return NextResponse.json(tag, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Tag name may already exist" }, { status: 409 });
  }
}
