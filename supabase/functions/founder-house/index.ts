import { createClient } from "npm:@supabase/supabase-js@2.110.7";
import { createHandler } from "./handler.ts";
import { smtpMailer } from "./smtp.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "info_ops" as "public" },
});

const { data: secretRows, error: secretError } = await client
  .from("edge_runtime_secrets")
  .select("key,value")
  .eq("scope", "founder-house");

if (secretError) {
  console.warn("Founder House runtime-secret fallback is unavailable.");
}

const runtimeSecrets = new Map<string, string>(
  (secretRows ?? []).map((row) => [String(row.key), String(row.value)]),
);
const runtimeEnv = (name: string) =>
  Deno.env.get(name) ?? runtimeSecrets.get(name);

Deno.serve(
  createHandler(client, {
    mailer: smtpMailer(runtimeEnv),
    lumaKey: runtimeEnv("FOUNDER_HOUSE_LUMA_API_KEY"),
    meetupToken: runtimeEnv("FOUNDER_HOUSE_MEETUP_ACCESS_TOKEN"),
    meetupGroup: runtimeEnv("FOUNDER_HOUSE_MEETUP_GROUP"),
    meetupPublicVenueId: runtimeEnv("FOUNDER_HOUSE_MEETUP_PUBLIC_VENUE_ID"),
    publishWebhook: runtimeEnv("FOUNDER_HOUSE_PUBLISH_WEBHOOK"),
    publishSecret: runtimeEnv("FOUNDER_HOUSE_PUBLISH_SECRET"),
  }),
);
