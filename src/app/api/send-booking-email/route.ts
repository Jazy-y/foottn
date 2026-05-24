import { NextRequest, NextResponse } from "next/server";

/**
 * Booking confirmation email route.
 * Uses Resend if RESEND_API_KEY is configured, otherwise logs to console
 * (so the rest of the app works without an email provider).
 */
export async function POST(req: NextRequest) {
  try {
    const { to, stadiumName, date, time, total, ticketCode } = await req.json();

    const html = `
      <div style="font-family:monospace;background:#0a0c14;color:#e2e8f0;padding:32px;border-radius:12px;max-width:540px">
        <h2 style="color:#7dd3fc;margin-bottom:8px">✅ Réservation Confirmée</h2>
        <p style="color:#94a3b8;margin-bottom:24px">Votre réservation a été confirmée avec succès.</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#94a3b8">Stade</td><td style="padding:8px 0;text-align:right">${stadiumName}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Date</td><td style="padding:8px 0;text-align:right">${date}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Horaire</td><td style="padding:8px 0;text-align:right">${time}</td></tr>
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
          from: "FootTN <noreply@foottn.io>",
          to,
          subject: `✅ Réservation confirmée — ${stadiumName}`,
          html,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
    } else {
      // Dev mode: log instead of sending
      console.log(`[BookingEmail] to=${to} stadium=${stadiumName} ticket=${ticketCode}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email error";
    console.error("[BookingEmail]", message);
    // Don't fail the booking if email fails
    return NextResponse.json({ ok: false, error: message });
  }
}
