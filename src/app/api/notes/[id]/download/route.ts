import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateDocx, generatePdf } from "@/lib/export-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format");

  if (!format || !["pdf", "docx"].includes(format)) {
    return NextResponse.json({ error: "Invalid format. Use ?format=pdf or ?format=docx" }, { status: 400 });
  }

  try {
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), isAdmin ? undefined : eq(notes.userId, session.user.id)));

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const title = note.title || "untitled";
    const content = note.content || "";
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, "_").slice(0, 100);

    if (format === "docx") {
      const buffer = await generateDocx(title, content);
      return new Response(new Blob([new Uint8Array(buffer)]), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
        },
      });
    }

    const pdfBuffer = await generatePdf(title, content);
    const pdfData = Buffer.from(pdfBuffer);
    return new Response(new Blob([pdfData]), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Download error:", msg, e);
    return NextResponse.json({ error: `Failed to generate file: ${msg}` }, { status: 500 });
  }
}
