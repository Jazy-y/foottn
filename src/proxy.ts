/**
 * Next.js Edge Middleware — server-side route protection for FootTN.
 *
 * Strategy:
 *  - AuthContext sets lightweight __footy_session / __footy_role cookies after
 *    Firebase sign-in. Middleware reads these cookies to gate routes before the
 *    React tree is ever rendered.
 *  - This is a defence-in-depth layer. The real security is Firestore rules +
 *    the client-side <AuthGuard> component which verifies the Firebase token.
 *
 * Route matrix:
 *  /admin/*        → requires __footy_role = SUPER_ADMIN
 *  /owner/*        → requires __footy_role = OWNER | SUPER_ADMIN
 *  /dashboard, /profile, /bookings, /teams, /events,
 *  /feed, /wallet, /support, /settings  → requires __footy_session
 *  /login, /register, /forgot-password  → redirect to /dashboard if already signed in
 *  everything else → public
 */

import { NextRequest, NextResponse } from "next/server";

// ── Route categories ──────────────────────────────────────────────────────────

const ADMIN_PREFIX  = "/admin";
const OWNER_PREFIX  = "/owner";

const AUTH_PREFIXES = ["/login", "/register", "/forgot-password"];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/bookings",
  "/teams",
  "/events",
  "/feed",
  "/wallet",
  "/support",
  "/settings",
];

function startsWith(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

// ── Proxy (replaces middleware in Next.js 16) ─────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get("__footy_session")?.value;
  const role    = request.cookies.get("__footy_role")?.value;
  const isLoggedIn = Boolean(session);

  // ── 1. Auth pages → bounce logged-in users to their dashboard ──────────────
  if (startsWith(pathname, AUTH_PREFIXES) && isLoggedIn) {
    const dest =
      role === "SUPER_ADMIN" ? "/admin"   :
      role === "OWNER"       ? "/owner"   :
                               "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── 2. Admin routes ────────────────────────────────────────────────────────
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!isLoggedIn) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── 3. Owner routes ────────────────────────────────────────────────────────
  if (pathname.startsWith(OWNER_PREFIX)) {
    if (!isLoggedIn) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "OWNER" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── 4. General protected routes ────────────────────────────────────────────
  if (startsWith(pathname, PROTECTED_PREFIXES) && !isLoggedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Only run on pages — skip static files, images, and API routes.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js|map)|api/).*)",
  ],
};
