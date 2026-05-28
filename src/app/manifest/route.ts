import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Littera",
    short_name: "Littera",
    description: "AI-powered note-taking platform for university students",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#6C4CE0",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  });
}
