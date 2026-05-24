/**
 * Demo-mode feature flags
 *
 * Set NEXT_PUBLIC_DEMO_MODE=true in Vercel to activate.
 * Each flag controls a specific unfinished or sensitive feature.
 * Usage:
 *   import { DEMO } from "@/lib/demo"
 *   if (DEMO.walletEnabled) { ... }
 */

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO = {
  /** Master switch — true when running in demo environment */
  active: isDemo,

  /** Wallet top-up & real transactions disabled in demo */
  walletTopUpEnabled: !isDemo,

  /** Stripe live checkout disabled; shows "demo only" toast instead */
  stripeCheckoutEnabled: !isDemo,

  /** AI chatbot (stub in dev, real OpenAI in prod) */
  chatbotEnabled: !isDemo,

  /** Invoice PDF download */
  invoiceDownloadEnabled: !isDemo,

  /** Account deletion — always disabled in demo to protect seed data */
  accountDeletionEnabled: !isDemo,

  /** Registration of new accounts — disable to keep demo data clean */
  publicRegistrationEnabled: !isDemo,
} as const;

/**
 * Call this in any Server Action or API route to reject requests
 * that should not run in demo mode.
 *
 * @example
 *   guardDemo("wallet top-up");
 */
export function guardDemo(featureName = "This feature") {
  if (isDemo) {
    throw new Error(`${featureName} is disabled in demo mode.`);
  }
}
