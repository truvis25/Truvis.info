// Public runtime configuration with safe built-in defaults.
//
// The Supabase URL and anon (publishable) key are public by design — they are
// shipped to every browser and all access is enforced by RLS. Env vars still
// override these defaults per environment (previews, staging, local).
// Secrets (SUPABASE_SERVICE_ROLE_KEY, webhook/cron secrets, Stripe keys) have
// NO defaults and must always come from environment variables.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://bieaydivdamnkdtmfsmg.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_2oP38_2GUuUgPMW0_HIi6Q_T_mEwjnu";

// Public CDN base for the public-media storage bucket (org branding and
// catalog images). Public by design — reads are open on the bucket.
export const MEDIA_BASE = `${SUPABASE_URL}/storage/v1/object/public/public-media/`;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://truvis.info");
