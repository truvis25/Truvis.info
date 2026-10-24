# Event publication

Publishing a real event saves it on Founder House and starts all configured channel attempts concurrently. Drafts do not create external listings. Changes to published events, returning to draft and cancellations trigger synchronization using saved external IDs. Failures on one channel do not prevent the other attempts. There is no background retry scheduler: organisers use “Sync / retry channels” for definite failures, and review uncertain outcomes before retrying.

The dispatcher records one row per event/channel, a hash of its public content, an attempt count, a claim token, a status and external IDs/links. An unchanged confirmed version is not sent again. Concurrent requests use a compare-and-swap claim. A network timeout or an ambiguous response moves to manual review; it never silently retries a potentially successful create. The organiser desk can record a verified listing receipt or explicitly mark an attempt safe to retry.

## Connections

All credentials belong in the shared Supabase project's Edge Function secrets. They never belong in `NEXT_PUBLIC_*`, the Vercel client bundle, repository files or publication packs.

| Channel | Implementation | Required connection |
| --- | --- | --- |
| Luma | Native create/update API | `FOUNDER_HOUSE_LUMA_API_KEY`, for a Luma Plus calendar |
| Meetup | Native create-draft then publish/edit via GraphQL | `FOUNDER_HOUSE_MEETUP_ACCESS_TOKEN`, `FOUNDER_HOUSE_MEETUP_GROUP`; Pro and approved API access |
| Eventbrite | Authenticated publishing workflow | `FOUNDER_HOUSE_PUBLISH_WEBHOOK` and `FOUNDER_HOUSE_PUBLISH_SECRET`; the workflow must have Eventbrite organiser access |
| LinkedIn | Authenticated publishing workflow | Same workflow settings; the workflow must have permission to publish to the intended company page |

An optional `FOUNDER_HOUSE_MEETUP_PUBLIC_VENUE_ID` can identify a deliberately public meeting area. Do not use a private event venue here. Without it, the group/account must support an unspecified venue; a rejected field or account permission is reported as a failure for review.

Configuration is not proof of account access. External account tests remain required. No publishing accounts or paid plans were created, and no real event was published externally during this work. Meetup access-token refresh must be managed by the account's OAuth integration; an expired token is shown as a failed connection.

## Workflow contract

The HTTPS workflow receives one request per channel with a bearer secret and an `idempotency-key` header. It must enforce this key across retries and return the same receipt for a repeated request. Redirects are rejected. The body is:

```json
{
  "version": 1,
  "idempotencyKey": "<event-id>:<public-content-hash>:<channel>",
  "channel": "Eventbrite",
  "action": "publish",
  "externalId": null,
  "event": {
    "id": "<id>",
    "title": "<title>",
    "description": "<public description with membership instructions>",
    "starts_at": "<ISO date>",
    "ends_at": "<ISO date>",
    "area": "<public area>",
    "capacity": 12,
    "url": "https://house.truvis.info/events/<id>"
  },
  "registrationUrl": "https://house.truvis.info/events/<id>",
  "requiresMemberApproval": true
}
```

Actions are `publish`, `update` and `withdraw`. `externalId` is included when previously recorded. No private venue, member application, CV or guest list is sent.

A confirmed publication response must include:

```json
{
  "status": "published",
  "external_id": "<platform-event-or-post-id>",
  "external_url": "https://www.eventbrite.com/e/<event>"
}
```

For changes/withdrawals return `status: "synced"` and the existing platform ID and URL. A bare HTTP success or `{ "accepted": true }` is only `accepted`, not published. The organiser must verify the result and record the receipt. There is no public callback endpoint and no unauthenticated receipt-write route.

## Admission, changes and cancellation

Founder House owns membership and final RSVP capacity. An external RSVP does not grant admission. Luma registrations require approval; Meetup and workflow descriptions direct visitors to the Founder House event page. Automatic import of external attendees and cross-platform ticket inventory is not implemented.

Luma cancellation synchronization closes registration and marks the listing cancelled without deleting the event or initiating refunds. Meetup returns the listing to draft. Workflow channels receive `withdraw`; their implementer must reconcile existing registrations and ticketing according to the organiser's policies. Review each channel status after cancellation. Increasing capacity is supported; reducing capacity after creation is rejected to avoid invalidating confirmed reservations.

## Calendar

`/events/calendar.ics` is a public subscription feed for Apple Calendar, Google Calendar and Outlook. It contains public event information, stable UIDs and future cancellations. It does not expose private venues or attendee details. Calendar clients choose their refresh frequency.

## Documentation checked

- https://docs.luma.com/reference/getting-started-with-your-api
- https://docs.luma.com/reference/post_v1-events-create
- https://docs.luma.com/reference/post_v1-events-update
- https://www.meetup.com/graphql/guide/
- https://help.meetup.com/hc/en-us/articles/41453576628749-How-can-I-get-access-to-Meetup-s-API
