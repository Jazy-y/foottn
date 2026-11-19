import {
  HttpError,
  errorResponse,
  getDocumentAsUser,
  requireUser,
} from "@/lib/server/firebase-auth";
import { STADIUM_TIME_ZONE } from "@/lib/pricing";

/**
 * Booking confirmation email.
 *
 * The caller must be signed in and own the booking. Every value in the email
 * comes from the stored booking (read under Firestore rules as that user), and
 * the message is only sent to the signed-in account's own email address, so
 * the endpoint cannot be used to send arbitrary content to arbitrary people.
 *
 * Uses Resend when RESEND_API_KEY is configured; otherwise it logs a short
 * line so the booking flow still works without an email provider.
 */

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: STADIUM_TIME_ZONE, ...options }).format(date);
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Your account has no email address.");

    const { bookingId } = (await req.json().catch(() => ({}))) as { bookingId?: unknown };
    if (typeof bookingId !== "string" || bookingId.length === 0) {
      throw new HttpError(400, "bookingId is required.");
    }

    const booking = await getDocumentAsUser(user, "bookings", bookingId);
    if (!booking || booking.userId !== user.uid) {
      throw new HttpError(404, "Booking not found.");
    }
    if (booking.paymentStatus !== "PAID") {
      throw new HttpError(409, "Booking is not confirmed yet.");
    }

    const start = booking.startTime instanceof Date ? booking.startTime : null;
    const stadiumName = escapeHtml(booking.stadiumName);
    const date = start ? formatDate(start, { day: "2-digit", month: "short", year: "numeric" }) : "—";
    const time = start ? formatDate(start, { hour: "2-digit", minute: "2-digit" }) : "—";
    const total = Number(booking.totalPrice ?? 0).toFixed(2);
    const ticketCode = escapeHtml(booking.ticketCode);

    const html = `
      <div style="font-family:monospace;background:#0a0c14;color:#e2e8f0;padding:32px;border-radius:12px;max-width:540px">
        <h2 style="color:#7dd3fc;margin-bottom:8px">✅ Réservation Confirmée</h2>
        <p style="color:#94a3b8;margin-bottom:24px">Votre réservation a été confirmée avec succès.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#94a3b8">Stade</td><td style="padding:8px 0;text-align:right">${stadiumName}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Date</td><td style="padding:8px 0;text-align:right">${escapeHtml(date)}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Horaire</td><td style="padding:8px 0;text-align:right">${escapeHtml(time)}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Total</td><td style="padding:8px 0;text-align:right;color:#7dd3fc;font-weight:bold">${total} TND</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Code ticket</td><td style="padding:8px 0;text-align:right;font-weight:bold">${ticketCode}</td></tr>
        </table>
        <p style="margin-top:24px;color:#94a3b8;font-size:12px">Présentez votre code ticket à l'entrée du stade.</p>
        <p style="color:#475569;font-size:11px;margin-top:16px">FootTN · Gestion de Stades Privés</p>
      </div>
    `;

    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "FootTN <noreply@foottn.io>",
          to: user.email,
          subject: `✅ Réservation confirmée — ${String(booking.stadiumName ?? "FootTN")}`,
          html,
        }),
      });
      if (!res.ok) throw new HttpError(502, "Email provider rejected the message.");
    } else {
      console.warn(`[BookingEmail] RESEND_API_KEY not set; skipped email for booking ${bookingId}`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Could not send the confirmation email.");
  }
}
