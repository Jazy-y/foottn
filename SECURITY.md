# Security notes

This document records the security review of FootTN, what was fixed and what remains open. FootTN is a portfolio project. Stripe runs in test mode, and the app must not process real payments until the open items below are closed.

## Fixed in the portfolio-readiness review

| Issue | Fix |
| --- | --- |
| **Client-supplied payment amounts.** `/api/create-payment-intent` charged whatever `amount` (and `currency`) the browser sent, and anyone could call it. | The route requires a Firebase ID token. For bookings it reads the booking and stadium from Firestore as the caller, checks ownership and status, recomputes the price with the shared `src/lib/pricing.ts`, and rejects mismatches. Wallet top-ups are limited to 5–5,000. The currency is fixed on the server. |
| **Unused, unauthenticated Stripe Checkout route** (`/api/stripe/checkout`) that also accepted a client amount | Removed (no caller in the app) |
| **Open email relay.** `/api/send-booking-email` sent HTML built from unescaped request fields to any `to` address, without authentication. | Requires a Firebase ID token. Only sends to the caller's own email, only for their own `PAID` booking, with values read from Firestore and HTML-escaped. |
| **Hardcoded admin credentials.** `scripts/create-admin.mjs` contained the Firebase config, a default admin e-mail and a default password, and printed the password. | Rewritten with the Firebase Admin SDK: credentials come from `GOOGLE_APPLICATION_CREDENTIALS`, the e-mail is a required argument, a new account's password comes from `ADMIN_PASSWORD` (12+ characters) and is never printed. It sets both the `role` custom claim and the profile field. |
| **Webhook error leakage.** The Stripe webhook returned raw error messages. | It returns a generic message and logs the detail on the server. |
| **Build-time crash.** The Stripe client was created at module load, so `next build` failed without secrets. | The client is created lazily inside the handler. |
| **Unused unauthenticated endpoints** (`/api/upload`, `/api/ai/*` stubs returning canned data) | Removed (no callers) |

## Open items (need credentials or an architecture decision)

1. **Payment confirmation and wallet balance are written by the client.** Firestore rules let a booking owner set `paymentStatus: "PAID"` on their own booking, let users update their own `walletBalance`, and let them create `walletTransactions`. A malicious user can therefore mark a booking as paid or credit their wallet without paying. The fix:
   - Add the Firebase Admin SDK to the server, with a service account stored as a Vercel environment variable.
   - Fulfil payments in `/api/stripe/webhook` on `payment_intent.succeeded`, using the `bookingId` and `uid` metadata that the payment route already attaches.
   - Change the rules so clients cannot write `paymentStatus`, `walletBalance` or `walletTransactions`.

   This was not done because it needs production credentials and a change to the deployed rules.
2. **Support-ticket messages are readable by every signed-in user** (`ticketMessages` has `allow read: if signedIn()`). Restrict reads to the ticket owner and admins, and test the query with the emulator before deploying.
3. **Profiles, including `walletBalance`, are readable by every signed-in user.** Consider moving private fields to a sub-document.
4. **Event creation is limited to owners/admins only in the UI;** the rules allow any signed-in user to create an event.
5. `/api/invoices/[bookingId]` is unauthenticated. It only prints the booking ID and a timestamp, but it should check ownership once it shows real invoice data.
6. `src/proxy.ts` trusts client-set role cookies. This is acceptable as a navigation layer only, because data access is enforced by Firestore rules.

## Git history

- An earlier commit contains the Firebase **web** API key and project identifiers in `scripts/create-admin.mjs`. These values are public by design for Firebase web apps, but the key should be restricted (HTTP referrers + APIs) in Google Cloud Console.
- The same commit contains a **default admin password**. If an admin account was ever created with that default, **change its password now**. Removing it from history needs a history rewrite and force-push, which was not done.
- No Stripe secret keys, webhook secrets, service-account keys or `.env` files were found in any commit.

## Reporting

Please report security issues privately to the repository owner instead of opening a public issue.
