import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 },
      );
    }
    const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });

    const { amount = 0, bookingId } = await req.json();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "tnd",
            unit_amount: Math.max(100, Math.round(Number(amount) * 1000)),
            product_data: { name: `FootTN booking ${bookingId ?? ""}`.trim() },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bookings/${bookingId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bookings/${bookingId}`,
      metadata: { bookingId: bookingId ?? "" },
    });
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
