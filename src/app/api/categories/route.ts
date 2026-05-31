import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 100, 200);

  try {
    const all = await db
      .select()
      .from(categories)
      .where(isAdmin ? undefined : eq(categories.userId, session.user.id))
      .orderBy(asc(categories.name))
      .limit(limit);
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let name: string;
  let template: string;
  try {
    const body = await request.json();
    name = typeof body.name === "string" ? body.name.trim() : "";
    template = typeof body.template === "string" ? body.template.trim().slice(0, 50000) : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Category name too long" }, { status: 400 });
  }
  try {
    const [cat] = await db
      .insert(categories)
      .values({
        userId: session.user.id,
        name,
        template,
      })
      .returning();
    return NextResponse.json(cat, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
