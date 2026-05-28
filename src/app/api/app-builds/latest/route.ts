import { NextResponse } from "next/server";
import { db } from "@/db";
import { appBuilds } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const [build] = await db
      .select()
      .from(appBuilds)
      .orderBy(desc(appBuilds.createdAt))
      .limit(1);

    if (!build) return NextResponse.json({ error: "No build available" }, { status: 404 });

    const buffer = Buffer.from(build.fileData, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${build.fileName}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
