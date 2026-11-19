import Stripe from "stripe";
import {
  HttpError,
  errorResponse,
  getDocumentAsUser,
  requireUser,
} from "@/lib/server/firebase-auth";
import {
  WALLET_TOPUP_MAX,
  WALLET_TOPUP_MIN,
  calculateBookingPrice,
  stadiumLocalHour,
} from "@/lib/pricing";

/**
 * Creates a Stripe PaymentIntent for a booking or a wallet top-up.
 *
 * The amount is never taken from the client for bookings: it is recomputed
 * from the stored booking and the stadium's hourly price. The caller must be
 * signed in, and the booking is read with the caller's own Firebase token so
 * Firestore rules confirm they are allowed to see it.
 *
 * Charges keep the existing EUR currency used by the app's Stripe account.
 */
const CURRENCY = "eur";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(500, "Payments are not configured.");
  return new Stripe(key);
}

function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

async function bookingAmount(
  user: Awaited<ReturnType<typeof requireUser>>,
  bookingId: unknown,
) {
  if (typeof bookingId !== "string" || bookingId.length === 0) {
    throw new HttpError(400, "bookingId is required.");
  }
  const booking = await getDocumentAsUser(user, "bookings", bookingId);
  if (!booking || booking.userId !== user.uid) {
    throw new HttpError(404, "Booking not found.");
  }
  if (booking.paymentStatus === "PAID" || booking.status === "CANCELLED") {
    throw new HttpError(409, "This booking can no longer be paid.");
  }

  const start = booking.startTime;
  const end = booking.endTime;
  if (!(start instanceof Date) || !(end instanceof Date) || typeof booking.stadiumId !== "string") {
    throw new HttpError(422, "Booking data is incomplete.");
  }
  const durationHours = (end.getTime() - start.getTime()) / 3_600_000;
  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24) {
    throw new HttpError(422, "Booking duration is invalid.");
  }

  const stadium = await getDocumentAsUser(user, "stadiums", booking.stadiumId);
  const pricePerHour = Number(stadium?.pricePerHour);
  if (!stadium || !Number.isFinite(pricePerHour) || pricePerHour <= 0) {
    throw new HttpError(422, "Stadium price is unavailable.");
  }

  const { total } = calculateBookingPrice(pricePerHour, durationHours, stadiumLocalHour(start));

  // The booking stores the total the user confirmed. If it disagrees with the
  // server calculation, refuse rather than silently charging another amount.
  if (Math.abs(Number(booking.totalPrice) - total) > 0.01) {
    throw new HttpError(409, "Booking price has changed. Please create the booking again.");
  }

  return {
    amount: total,
    metadata: {
      type: "booking",
      bookingId,
      stadiumId: booking.stadiumId,
      stadiumName: String(booking.stadiumName ?? ""),
    },
  };
}

function topUpAmount(amount: unknown) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < WALLET_TOPUP_MIN || value > WALLET_TOPUP_MAX) {
    throw new HttpError(
      400,
      `Top-up amount must be between ${WALLET_TOPUP_MIN} and ${WALLET_TOPUP_MAX}.`,
    );
  }
  return {
    amount: Math.round(value * 100) / 100,
    metadata: { type: "wallet_topup" },
  };
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const { amount, metadata } =
      body.type === "wallet_topup"
        ? topUpAmount(body.amount)
        : await bookingAmount(user, body.bookingId);

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: toMinorUnits(amount),
      currency: CURRENCY,
      metadata: { ...metadata, uid: user.uid },
      // Card-only: avoids redirect-based methods that conflict with
      // redirect: "if_required" on the client.
      payment_method_types: ["card"],
    });

    return Response.json({ clientSecret: paymentIntent.client_secret, amount });
  } catch (error) {
    return errorResponse(error, "Could not initialise the payment.");
  }
}
