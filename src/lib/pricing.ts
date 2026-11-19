/**
 * Booking price calculation shared by the booking widget (display) and the
 * payment API (authoritative amount). Keeping one implementation guarantees
 * that the server charges exactly what the user was shown.
 */

/** Slots starting at or after this hour (stadium local time) are peak hours. */
export const PEAK_START_HOUR = 18;
export const PEAK_MULTIPLIER = 1.2;
export const SERVICE_FEE_RATE = 0.04;

/** Stadium slots are expressed in Tunisian local time. */
export const STADIUM_TIME_ZONE = "Africa/Tunis";

export interface BookingPrice {
  subtotal: number;
  fees: number;
  total: number;
  isPeak: boolean;
}

export function calculateBookingPrice(
  pricePerHour: number,
  durationHours: number,
  startHour: number,
): BookingPrice {
  const isPeak = startHour >= PEAK_START_HOUR;
  const subtotal = pricePerHour * durationHours * (isPeak ? PEAK_MULTIPLIER : 1);
  const fees = subtotal * SERVICE_FEE_RATE;
  return { subtotal, fees, total: subtotal + fees, isPeak };
}

/** Hour of day (0-23) of `date` in the stadium time zone. */
export function stadiumLocalHour(date: Date): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: STADIUM_TIME_ZONE,
  }).format(date);
  return Number(hour);
}

/** Wallet top-up limits, mirrored by the wallet page form. */
export const WALLET_TOPUP_MIN = 5;
export const WALLET_TOPUP_MAX = 5000;
