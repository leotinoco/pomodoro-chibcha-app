import type { NextConfig } from "next";

// Next.js dev server needs eval for HMR; production must not allow it.
const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "",
  "https://www.googletagmanager.com https://www.google-analytics.com",
]
  .filter(Boolean)
  .join(" ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "0",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://www.google-analytics.com",
              "font-src 'self'",
              "connect-src 'self' https://oauth2.googleapis.com https://www.googleapis.com https://www.google-analytics.com",
              "media-src 'self' blob:",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
