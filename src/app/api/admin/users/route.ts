import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { asc, ilike, eq, and, or, isNull, isNotNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const role = request.nextUrl.searchParams.get("role")?.trim();
    const verified = request.nextUrl.searchParams.get("verified")?.trim();

    const conditions = [];

    if (search) {
      conditions.push(
        or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)),
      );
    }

    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (verified === "true") {
      conditions.push(isNotNull(users.emailVerified));
    } else if (verified === "false") {
      conditions.push(isNull(users.emailVerified));
    }

    const query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(request.nextUrl.searchParams.get("offset")) || 0, 0);

    const all = await query.orderBy(asc(users.createdAt)).limit(limit).offset(offset);

    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
