import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/config";

// Service-role client — bypasses RLS. Use ONLY in webhook handlers, cron jobs,
// and trusted server actions. The service key is a secret with no default;
// callers must check for it and degrade gracefully when absent.
export function createAdminClient() {
  return createSupabaseClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// Null-safe variant for best-effort callers (e.g. email notifications): returns
// null instead of building a client with an undefined key, so a dev environment
// without the service key degrades gracefully rather than crashing.
export function tryCreateAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createAdminClient();
}
