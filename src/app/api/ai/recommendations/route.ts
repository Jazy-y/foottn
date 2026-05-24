import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const profile = body?.profile ?? {};
  return NextResponse.json({
    recommendations: [
      { stadiumId: "demo-1", score: 0.92, reason: `Matches ${profile.position ?? "your"} profile` },
      { stadiumId: "demo-2", score: 0.85, reason: "High compatibility with preferred time slots" },
    ],
  });
}
