import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appBuilds } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const builds = await db
    .select({ id: appBuilds.id, version: appBuilds.version, fileName: appBuilds.fileName, fileSize: appBuilds.fileSize, createdAt: appBuilds.createdAt })
    .from(appBuilds)
    .orderBy(desc(appBuilds.createdAt));

  return NextResponse.json(builds);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const version = formData.get("version") as string | null;

    if (!file || !version) return NextResponse.json({ error: "File and version required" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const [build] = await db
      .insert(appBuilds)
      .values({
        version,
        fileData: base64,
        fileName: file.name,
        fileSize: buffer.length,
      })
      .returning({ id: appBuilds.id, version: appBuilds.version, fileName: appBuilds.fileName, fileSize: appBuilds.fileSize });

    return NextResponse.json(build, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}
