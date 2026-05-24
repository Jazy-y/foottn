import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !sig || !secret) {
    return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });
  }
  try {
    const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, sig, secret);
    if (event.type === "checkout.session.completed") {
      // TODO: update booking + wallet/invoice documents in Firestore.
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
