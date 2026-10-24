import type { NextConfig } from "next";
import path from "node:path";
const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: path.resolve(process.cwd(), "../..") },
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://hyzotwxtqssefsgryawl.supabase.co; frame-ancestors ${process.env.NODE_ENV === "development" ? "'self'" : "'none'"}; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
    ];
  },
};
export default config;
