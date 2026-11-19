import { auth } from "@/lib/firebase";

/**
 * `fetch` wrapper for FootTN API routes that require a signed-in user.
 * Attaches the current Firebase ID token as a Bearer token.
 */
export async function authedFetch(input: string, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Vous devez être connecté.");
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}
