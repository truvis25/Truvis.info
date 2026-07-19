// Public runtime configuration with safe built-in defaults.
//
// The Supabase URL and anon (publishable) key are public by design — they are
// shipped to every browser and all access is enforced by RLS. Env vars still
// override these defaults per environment (previews, staging, local).
// Secrets (SUPABASE_SERVICE_ROLE_KEY, webhook/cron secrets, Stripe keys) have
// NO defaults and must always come from environment variables.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://hyzotwxtqssefsgryawl.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5em90d3h0cXNzZWZzZ3J5YXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Njk0NjUsImV4cCI6MjEwMDA0NTQ2NX0.eL3ytBDBflMRCekhXCjTaBj3sR3qOcdQV55JLm91BgA";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://truvis.info");
