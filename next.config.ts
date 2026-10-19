import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Security headers (Phase 6, DECISION_LOG 063). Content Security Policy follows the Next.js guide's
 * "without nonces" option: nonces would force every page to render per request, which this app's
 * partial prerendering doesn't allow, so inline scripts and styles are permitted. Everything else is
 * locked to this site and the Supabase project: no other scripts, connections, frames or forms.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self' ${supabase}`.trim(),
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  /* config options here */
  cacheComponents: true,
  // Real meal photos are hot-linked from these licensed sources and resized/cached by Next.js.
  // `search` is left open because the hosts use query strings for size/format.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
