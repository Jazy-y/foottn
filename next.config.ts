import type { NextConfig } from "next";

const isDev  = process.env.NODE_ENV === "development";
const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // ── Strip console.* calls in production/demo builds ───────────────────────
  // console.log leaks internal data and slows the browser.
  compiler: {
    removeConsole: !isDev ? { exclude: ["error", "warn"] } : false,
  },

  // ── Image domains ─────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "footy-99dd4.firebasestorage.app" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    // Serve modern formats automatically (WebP/AVIF) — free perf win on Vercel
    formats: ["image/avif", "image/webp"],
  },

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent browsers from MIME-sniffing
          { key: "X-Content-Type-Options",    value: "nosniff" },
          // Stop clickjacking
          { key: "X-Frame-Options",           value: "DENY" },
          // Only send origin on same-origin requests
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          // Disable browser features not used by FootTN
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // ── Redirect non-www → www (optional, for custom domain) ─────────────────
  // async redirects() {
  //   return [
  //     {
  //       source: "/(.*)",
  //       has: [{ type: "host", value: "foottn.com" }],
  //       destination: "https://www.foottn.com/:path*",
  //       permanent: true,
  //     },
  //   ];
  // },

  ...(isDemo && {
    // In demo mode, turn off source maps so the bundle can't be inspected easily
    productionBrowserSourceMaps: false,
  }),
};

export default nextConfig;
