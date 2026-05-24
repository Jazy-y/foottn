import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const question = String(body?.message ?? "").trim();
  const answer = question
    ? `FootTN assistant: for "${question}", try checking stadium availability first, then confirm your team slots.`
    : "FootTN assistant is online. Ask anything about bookings, teams, or events.";
  return NextResponse.json({ answer });
}
