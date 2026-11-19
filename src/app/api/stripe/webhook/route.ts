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
    // Signature verification is in place, but server-side fulfilment is not:
    // writing bookings/wallets from here requires the Firebase Admin SDK and a
    // service account configured in the deployment. Until then, the client
    // records the payment result (see README → Known limitations).
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.warn(`[stripe-webhook] payment_intent.succeeded ${intent.id} (not fulfilled server-side)`);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook]", (error as Error).message);
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
}
