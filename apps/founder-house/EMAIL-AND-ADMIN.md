# Email and organiser access

## Live setup still needed

The email implementation and organiser launch-check panel are complete. Sending credentials, a real inbox test and verified owner sign-in remain launch requirements. As checked on 25 October 2026, the shared project has one platform administrator (`demo-admin@truvis.info`); `info@truvis.info` does not yet have an Auth account. Do not publish demo credentials or treat a code review as a verified owner login.

## Connect the sending mailbox

Verified on 25 October 2026: the domain MX points to Google Workspace (`smtp.google.com`), SPF includes `_spf.google.com`, and a DMARC monitoring record exists. No DKIM selector has been verified. In the authenticated project dashboard, `FOUNDER_HOUSE_SMTP_HOST=smtp.gmail.com`, `FOUNDER_HOUSE_SMTP_USER=info@truvis.info` and `FOUNDER_HOUSE_SMTP_PORT=465` have been saved. **The SMTP password has not been entered, and no real email delivery has been confirmed.** The owner must enter the mailbox's Google App Password directly in the secure settings; never use the normal account password or paste a secret in chat. If the address is an alias, the owner must use its authorised primary mailbox credentials.

The separate Auth SMTP form has been prepared with sender `info@truvis.info`, sender name `TRUVIS`, host `smtp.gmail.com`, port 465 and username `info@truvis.info`. It remains an **unsaved draft**, awaiting the owner's password entry and Save changes. This shared Auth setting also serves the parent Truvis app. The owner account has not been created or granted a role.

Use the existing company mailbox authorised to send as `info@truvis.info`. Save these **in Supabase Edge Function secrets**, never in git, client code, chat or the Vercel public variables:

| Secret | Value |
| --- | --- |
| `FOUNDER_HOUSE_SMTP_HOST` | The mailbox provider's SMTP hostname |
| `FOUNDER_HOUSE_SMTP_USER` | The authenticated mailbox username |
| `FOUNDER_HOUSE_SMTP_PASS` | Its existing SMTP/app password, entered securely by its owner |
| `FOUNDER_HOUSE_SMTP_PORT` | `465` (also the default) |

The sender and reply address are fixed to `info@truvis.info`; no mail settings are inherited from unrelated apps. Supabase Edge Functions block SMTP ports 25 and 587, so this adapter requires implicit TLS on 465 with normal certificate validation. For a Hostinger Email mailbox, confirm the mailbox product first; its documented server is `smtp.hostinger.com` on 465. Do not assume a domain's DNS provider is also its email provider.

Check SPF, DKIM and DMARC in the actual mail provider before launch. Preserve existing MX records and other senders' records. The current task has not verified those records or modified mail DNS.

Open `/admin` → **Launch checks**, refresh the email status and select **Send test to info@truvis.info**. Confirm arrival in the inbox (including spam), sender identity, readable layout, links and a reply. “Accepted by mail server” is not proof of inbox delivery. The test endpoint is organiser-only, always targets the company mailbox and allows at most six tests per hour.

Then run one owner-controlled real application and approval. Confirm both emails and member access. Use a fresh recipient or explicitly renew the invitation; old applications are not backfilled. A renewed invitation invalidates the old link. Never use a real applicant for testing.

## Owner access

Existing organisers sign in at `https://house.truvis.info/login` with Supabase Auth email/password. Authorisation uses the existing `user_profiles.platform_admin` role, independently checked in Next.js and the Edge Function. This role is shared with the parent Truvis platform; it is not a Founder House-only role.

To provision the company's owner account, use the project owner's authenticated Supabase dashboard and the secure Auth user invitation/setup flow for `info@truvis.info`. Complete email verification and password setup through the provider UI; never invent a password, ask for one in chat, reuse the demo account or mark email ownership as verified without the actual verification. Assign the existing administrator role only after the owner account and intended shared-platform access are confirmed. No account or role has been created by this change.

The Supabase Auth invitation/password-reset email settings are separate from this app's transactional SMTP settings. Do not change shared Auth SMTP or redirect settings without reviewing the parent app. The mail code here does not send Auth invitation or reset emails.

Verify: sign in → see the account email and launch checks → review a synthetic application → open its private CV → create a private draft gathering → sign out → confirm `/api/admin/email` and `/api/admin/applications` deny access. Keep event publishing and real applicant decisions separate from testing.

## Delivery behaviour

- New applications are saved before a receipt is attempted. Duplicate requests, honeypot submissions and reserved test addresses never trigger real mail.
- Approval commits the membership state and creates a 30-day private invitation. Only the token hash is stored; the raw link exists in the response and email only.
- A private metadata log records `accepted`, `not_configured`, `suppressed`, `failed` or `unknown`. Bodies, tokens, SMTP credentials and provider error payloads are never logged.
- Email failure never undoes an application or approval. No blind retry or background campaign runs. For an unknown result, check the mailbox first; generating a new invitation revokes the previous one.
- If the metadata log cannot be created, sending stops. If its final update fails, the UI reports the logging problem separately from the provider result.

## Remaining event-launch checks

No confirmed upcoming event is published yet. Luma, Meetup, Eventbrite and LinkedIn still require their actual account connections and a successful publication receipt. Connected configuration alone is not proof of publication.

References: [Supabase runtime limits](https://supabase.com/docs/guides/functions/limits), [SMTP setup for Hostinger Email](https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/), [Supabase Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

Google Workspace setup reference: [Send email from an app](https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app). Google requires an App Password for this SMTP flow and 2-Step Verification for creating one.

## Hosting-account follow-up

The authenticated Supabase dashboard currently displays an outstanding-invoices warning with a possible service-disruption notice. The owner must review billing before the public launch. No invoice has been paid and no billing settings have been changed during this work.
