import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const hasName = "name" in body;
    const hasImage = "image" in body;
    const name = hasName ? String(body.name).trim() : "";

    if (hasName && (!name || name.length > 100)) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const updateData: Record<string, string | null> = {};
    if (hasName) updateData.name = name;
    if (hasImage) {
      const rawImage = body.image;
      const image = rawImage === null ? null : String(rawImage).trim();
      if (image) {
        if (!image.startsWith("data:image/")) {
          return NextResponse.json({ error: "Invalid image" }, { status: 400 });
        }
        if (image.length > 5_000_000) {
          return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
        }
      }
      updateData.image = image;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning({ id: users.id, name: users.name, email: users.email, image: users.image });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
