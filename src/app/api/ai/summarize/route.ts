import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { aiSummarizeStream } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success, retryAfter } = rateLimit(`ai:${session.user.id}:summarize`, { max: 10, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }

  let content: string;
  try {
    const body = await request.json();
    content = body.content;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });

  try {
    const stream = await aiSummarizeStream(content);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return NextResponse.json({ error: "AI service error" }, { status: 500 });
  }
}
