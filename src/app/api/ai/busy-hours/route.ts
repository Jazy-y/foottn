import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const history = Array.isArray(body?.history) ? body.history : [];
  const avg = history.length ? history.reduce((a: number, b: number) => a + Number(b || 0), 0) / history.length : 0;
  return NextResponse.json({
    prediction: [
      { hour: "17:00", demand: Math.round(avg + 3) },
      { hour: "18:00", demand: Math.round(avg + 5) },
      { hour: "19:00", demand: Math.round(avg + 7) },
    ],
  });
}
