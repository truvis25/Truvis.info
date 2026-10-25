import { createClient } from "npm:@supabase/supabase-js@2.110.7";
import { createHandler } from "./handler.ts";
import { smtpMailer } from "./smtp.ts";
const url = Deno.env.get("SUPABASE_URL")!,
  key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
Deno.serve(
  createHandler(client, {
    mailer: smtpMailer((key) => Deno.env.get(key)),
    lumaKey: Deno.env.get("FOUNDER_HOUSE_LUMA_API_KEY"),
    meetupToken: Deno.env.get("FOUNDER_HOUSE_MEETUP_ACCESS_TOKEN"),
    meetupGroup: Deno.env.get("FOUNDER_HOUSE_MEETUP_GROUP"),
    meetupPublicVenueId: Deno.env.get("FOUNDER_HOUSE_MEETUP_PUBLIC_VENUE_ID"),
    publishWebhook: Deno.env.get("FOUNDER_HOUSE_PUBLISH_WEBHOOK"),
    publishSecret: Deno.env.get("FOUNDER_HOUSE_PUBLISH_SECRET"),
  }),
);
