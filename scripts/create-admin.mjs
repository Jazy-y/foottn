/**
 * Promote an existing or new account to SUPER_ADMIN.
 *
 * Uses the Firebase Admin SDK, because Firestore rules (correctly) prevent
 * any client from writing role = SUPER_ADMIN. Credentials are never stored in
 * this repository: authenticate with a service-account key kept outside the
 * project, or with `gcloud auth application-default login`.
 *
 *   # PowerShell
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\service-account.json"
 *   $env:FIREBASE_PROJECT_ID="your-project-id"
 *   node scripts/create-admin.mjs admin@example.com "Display Name"
 *
 * If the account does not exist yet, set ADMIN_PASSWORD (min. 12 characters)
 * for the new account. The password is never printed.
 */
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const [, , email, displayName = "FootTN Admin"] = process.argv;
const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function fail(message) {
  console.error(`[create-admin] ${message}`);
  process.exit(1);
}

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail("Usage: node scripts/create-admin.mjs <email> [displayName]");
}
if (!projectId) fail("Set FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID).");

initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const db = getFirestore();

async function findOrCreateUser() {
  try {
    return await auth.getUserByEmail(email);
  } catch (err) {
    if (err?.code !== "auth/user-not-found") throw err;
  }
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    fail(`${email} does not exist. Set ADMIN_PASSWORD (12+ characters) to create it.`);
  }
  const user = await auth.createUser({ email, password, displayName });
  console.log(`[create-admin] Created auth user uid=${user.uid}`);
  return user;
}

const user = await findOrCreateUser();

// The custom claim is read by AuthContext; the profile field drives
// Firestore rules (isAdmin()) and the UI.
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: "SUPER_ADMIN" });
const profileRef = db.doc(`users/${user.uid}`);
const existing = await profileRef.get();
const defaults = existing.exists
  ? {}
  : {
      walletBalance: 0,
      stats: { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, mvp: 0, rating: 50 },
      createdAt: FieldValue.serverTimestamp(),
    };
await profileRef.set(
  {
    ...defaults,
    email,
    displayName: user.displayName ?? displayName,
    role: "SUPER_ADMIN",
  },
  { merge: true },
);

console.log(`[create-admin] users/${user.uid} is now SUPER_ADMIN.`);
console.log("[create-admin] Sign out and back in to refresh the session role.");
