import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Server-side Firebase helpers that need no service-account credentials.
 *
 * - ID tokens are verified against Google's public signing keys, following
 *   Firebase's documented "verify ID tokens using a third-party JWT library"
 *   procedure.
 * - Firestore documents are read through the REST API *as the calling user*,
 *   so the deployed Firestore security rules still decide what can be read.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export interface VerifiedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  idToken: string;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Reads and verifies the `Authorization: Bearer <Firebase ID token>` header. */
export async function requireUser(req: Request): Promise<VerifiedUser> {
  if (!PROJECT_ID) {
    throw new HttpError(500, "Firebase project is not configured on the server.");
  }
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new HttpError(401, "Authentication required.");

  const idToken = match[1].trim();
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    });
    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw new Error("Missing subject");
    }
    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      emailVerified: payload.email_verified === true,
      idToken,
    };
  } catch {
    throw new HttpError(401, "Invalid or expired session.");
  }
}

// ── Firestore REST (read-only, evaluated under the caller's security rules) ──

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } }
  | Record<string, unknown>;

function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return new Date(String(value.timestampValue));
  if ("nullValue" in value) return null;
  if ("mapValue" in value) {
    const fields = (value.mapValue as { fields?: Record<string, FirestoreValue> }).fields ?? {};
    return decodeFields(fields);
  }
  if ("arrayValue" in value) {
    const values = (value.arrayValue as { values?: FirestoreValue[] }).values ?? [];
    return values.map(decodeValue);
  }
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, v]) => [key, decodeValue(v)]),
  );
}

/**
 * Fetches `collection/id` with the user's ID token. Returns `null` when the
 * document does not exist or the security rules deny access to this user.
 */
export async function getDocumentAsUser(
  user: VerifiedUser,
  collection: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return null;
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/documents/${collection}/${id}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${user.idToken}` },
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) throw new HttpError(502, "Could not read data from Firestore.");
  const json = (await res.json()) as { fields?: Record<string, FirestoreValue> };
  return decodeFields(json.fields ?? {});
}

export function errorResponse(error: unknown, fallback = "Unexpected server error.") {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: fallback }, { status: 500 });
}
