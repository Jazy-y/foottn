import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const {
      amount,
      currency = "eur",
      bookingId,
      stadiumName,
      type = "booking",
    } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Stripe requires amount in smallest currency unit (cents for EUR)
    const amountInCents = Math.round(amount * 100);

    const metadata: Record<string, string> = { type };
    if (bookingId)   metadata.bookingId   = bookingId;
    if (stadiumName) metadata.stadiumName = stadiumName;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
