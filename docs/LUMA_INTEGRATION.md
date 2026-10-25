# Luma calendar integration

Truvis uses one calendar-scoped Luma API key for a two-way event listing:

- A published Truvis event with **Also publish on Luma** enabled is created or
  updated on Luma immediately. Its Luma page links back to the canonical Truvis
  event; registration and protected online links stay on Truvis.
- Native public events on the Luma calendar are mirrored to `/events`. Their
  registration button opens the canonical Luma page.
- Signed webhooks provide near-real-time inbound updates. The daily Vercel cron
  repairs missed deliveries and reconciles removed events.

## Production activation

1. The target Luma calendar must have an active Luma Plus subscription.
2. Generate a calendar API key in **Calendar settings → Developer**.
3. Set these Vercel Production variables and redeploy:
   - `LUMA_API_KEY`
   - `LUMA_API_MODE=live`
   - `LUMA_WEBHOOK_SECRET`
   - `CRON_SECRET`
4. Create a Luma webhook pointing to
   `https://truvis.info/api/webhooks/luma` for:
   - `calendar.event.added`
   - `event.created`
   - `event.updated`
   - `event.canceled`
5. Run one authenticated `/api/cron/luma-sync` sweep and verify the event count,
   source filter, and Luma registration links on `/events`.

Production never publishes the built-in mock fixtures. Without a real key the
dashboard shows Luma as unavailable and continues publishing events locally.
