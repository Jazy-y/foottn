import { NextResponse } from "next/server";

const blocked = ["spam", "scam", "hate"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").toLowerCase();
  const flagged = blocked.some((w) => text.includes(w));
  return NextResponse.json({
    flagged,
    label: flagged ? "unsafe" : "safe",
  });
}
