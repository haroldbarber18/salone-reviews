import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Add GOOGLE_PLACES_API_KEY in Vercel, then redeploy." }, { status: 500 });
  }
  const name = req.nextUrl.searchParams.get("name") || "";
  if (!name.startsWith("places/")) {
    return NextResponse.json({ error: "Bad photo." }, { status: 400 });
  }
  const url = `https://places.googleapis.com/v1/${name}/media?maxHeightPx=800&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Google photo failed." }, { status: 502 });
  }
  const bytes = await res.arrayBuffer();
  return new NextResponse(bytes, {
    headers: { "Content-Type": res.headers.get("content-type") || "image/jpeg", "Cache-Control": "private, max-age=3600" },
  });
}