# Email and organiser access

## Verified live setup

The email implementation and organiser launch-check panel are complete. Hostinger SMTP is configured for transactional mail and shared Auth mail. A company-owned synthetic application was saved and its receipt accepted by SMTP on 25 October 2026 (`FH-9D687440`, subsequently declined as QA). The owner completed email verification and set a dedicated password. Real browser sign-in as `info@truvis.info` and loading the live administrator panel were verified. A second mail test from the organiser panel was accepted by SMTP. Receipt/test inbox placement and a reply still need confirmation. Do not publish demo credentials or treat a code review as a verified owner login.

## Connect the sending mailbox

The owner has replaced the earlier Google alias arrangement with an independent Hostinger mailbox `info@truvis.info`. SMTP uses `smtp.hostinger.com:465` and username `info@truvis.info`. Save credentials **in Supabase Edge Function secrets**, never in git, client code, chat or the Vercel public variables:

| Secret | Value |
| --- | --- |
| `FOUNDER_HOUSE_SMTP_HOST` | The mailbox provider's SMTP hostname |
| `FOUNDER_HOUSE_SMTP_USER` | `info@truvis.info` (independent Hostinger mailbox) |
| `FOUNDER_HOUSE_SMTP_PASS` | Existing mailbox password, saved only in encrypted server settings |
| `FOUNDER_HOUSE_SMTP_PORT` | `465` (also the default) |

The sender and reply address are fixed to `info@truvis.info`; no mail settings are inherited from unrelated apps. Supabase Edge Functions block SMTP ports 25 and 587, so this adapter requires implicit TLS on 465 with normal certificate validation. For a Hostinger Email mailbox, confirm the mailbox product first; its documented server is `smtp.hostinger.com` on 465. Do not assume a domain's DNS provider is also its email provider.

Check SPF, DKIM and DMARC in the actual mail provider before launch. Preserve existing MX records and other senders' records. MX, SPF and the DMARC monitoring record were checked; DKIM has not been verified. No mail DNS records were modified.

Open `/admin` → **Launch checks**, refresh the email status and select **Send test to info@truvis.info**. Confirm arrival in the inbox (including spam), sender identity, readable layout, links and a reply. “Accepted by mail server” is not proof of inbox delivery. The test endpoint is organiser-only, always targets the company mailbox and allows at most six tests per hour.

Then run one owner-controlled real application and approval. Confirm both emails and member access. Use a fresh recipient or explicitly renew the invitation; old applications are not backfilled. A renewed invitation invalidates the old link. Never use a real applicant for testing.

## Owner access

Verified on 25 October 2026: `info@truvis.info` is the only account with `platform_admin=true`. Email ownership and password setup were completed before the role was granted. The previous `demo-admin@truvis.info` administrator role was revoked. The owner signed in through the real `/login` form; Launch checks, Applications, Gatherings and Distribution loaded successfully from the live database. This did not publish events or approve real applicants. The role is shared with the parent TRUVIS platform.

Existing organisers sign in at `https://house.truvis.info/login` with Supabase Auth email/password. Authorisation uses the existing `user_profiles.platform_admin` role, independently checked in Next.js and the Edge Function. This role is shared with the parent Truvis platform; it is not a Founder House-only role.

To provision the company's owner account, send a Supabase Auth invitation to `info@truvis.info`. The shared invite template in `INVITATION-EMAIL.html` preserves the original confirmation link for parent-platform invitations, and adds the invitation code and the explicit Founder House setup link. `/login/setup` verifies only invitation codes (`type: invite`), then lets the verified owner set their own password and signs them out. The page does not create users, send unsolicited OTPs or assign roles. Codes and passwords are never returned in action state or logged. Complete email verification and password setup yourself; never invent a password, ask for one in chat, reuse the demo account or mark email ownership as verified without actual verification. Assign the administrator role only after the owner account and intended shared-platform access are confirmed.

Profile column privileges now prevent ordinary authenticated users from inserting or changing `platform_admin`. The default remains false; ordinary profile editing is preserved. This applies to the shared TRUVIS platform, not just Founder House. Verified via transactional tests: self-promotion by INSERT and UPDATE are denied, while editing one's own display name works; all test mutations were rolled back.

The Supabase Auth invitation/password-reset email settings are separate from this app's transactional SMTP settings. Do not change shared Auth SMTP or redirect settings without reviewing the parent app. The mail code here does not send Auth invitation or reset emails.

Verify: sign in → see the account email and launch checks → review a synthetic application → open its private CV → create a private draft gathering → sign out → confirm `/api/admin/email` and `/api/admin/applications` deny access. Keep event publishing and real applicant decisions separate from testing.

## Delivery behaviour

- New applications are saved before the applicant receipt and the separate organiser notification to `info@truvis.info` are attempted. Duplicate requests and honeypot submissions never trigger mail; reserved applicant addresses suppress the applicant receipt while the organiser notification still records the saved application.
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
