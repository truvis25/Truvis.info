import { publicEvent } from "./validation.ts";
export type EventRow = Record<string, any>;
export type PublishConfig = {
  lumaKey?: string;
  meetupToken?: string;
  meetupGroup?: string;
  meetupPublicVenueId?: string;
  publishWebhook?: string;
  publishSecret?: string;
};
export const CHANNELS = ["Luma", "Meetup", "Eventbrite", "LinkedIn"] as const;
export type Channel = (typeof CHANNELS)[number];
export type Receipt = {
  status: "published" | "synced" | "accepted";
  external_id?: string;
  external_url?: string;
  message?: string;
};
export class PublishError extends Error {
  readonly uncertain: boolean;
  constructor(message: string, uncertain = false) {
    super(message);
    this.uncertain = uncertain;
  }
}
export const ORIGIN = "https://house.truvis.info";
export function channelConfig(c: PublishConfig) {
  const bridge = !!(c.publishWebhook && c.publishSecret);
  return [
    {
      name: "Luma",
      connected: !!c.lumaKey,
      mode: "Direct API",
      requirement: "Luma Plus and a calendar API key.",
    },
    {
      name: "Meetup",
      connected: !!(c.meetupToken && c.meetupGroup),
      mode: "Direct GraphQL API",
      requirement:
        "Meetup Pro, approved API access, an access token and group URL name.",
    },
    {
      name: "Eventbrite",
      connected: bridge,
      mode: "Publishing workflow",
      requirement:
        "An authenticated publishing workflow connected to your Eventbrite organiser account.",
    },
    {
      name: "LinkedIn",
      connected: bridge,
      mode: "Publishing workflow",
      requirement:
        "An authenticated publishing workflow with permission to post to your LinkedIn page.",
    },
  ];
}
export function publicListing(e: EventRow) {
  const url = ORIGIN + "/events/" + e.id;
  return {
    ...publicEvent(e),
    url,
    description:
      e.description +
      "\n\nLocation: " +
      e.area +
      ", Abu Dhabi.\n\nFor approved Founder House members. Details and membership application: " +
      url +
      ". An external RSVP does not reserve a place or confirm admission. Reserve through Founder House member access after approval. Exact venue details are shared only with members.",
  };
}
export function validExternalUrl(
  channel: string,
  value: unknown,
): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const u = new URL(value);
    const domain: Record<string, string[]> = {
      Luma: ["luma.com", "lu.ma"],
      Meetup: ["meetup.com"],
      Eventbrite: ["eventbrite.com", "eventbrite.co.uk", "eventbrite.ae"],
      LinkedIn: ["linkedin.com"],
    };
    return u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      domain[channel]?.some(
        (d) => u.hostname === d || u.hostname.endsWith("." + d),
      )
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
async function requestJson(
  fetcher: typeof fetch,
  url: string,
  init: RequestInit,
  uncertain = true,
) {
  let r: Response;
  try {
    r = await fetcher(url, {
      ...init,
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
  } catch {
    throw new PublishError(
      "The channel did not confirm the request. Check its dashboard before retrying.",
      uncertain,
    );
  }
  let body: any;
  try {
    body = await r.json();
  } catch {
    throw new PublishError(
      "The channel returned an unreadable receipt. Check its dashboard.",
      uncertain,
    );
  }
  if (!r.ok)
    throw new PublishError(
      r.status === 401 || r.status === 403
        ? "Account access was rejected. Check the account connection."
        : r.status === 429
          ? "The channel rate limit was reached. Retry later."
          : "The channel rejected the request (HTTP " + r.status + ").",
      r.status >= 500 && uncertain,
    );
  return body;
}
export async function publishChannel(
  channel: Channel,
  e: EventRow,
  c: PublishConfig,
  externalId: string | undefined,
  checkpoint: (id: string, url?: string) => Promise<void>,
  fetcher: typeof fetch = fetch,
): Promise<Receipt> {
  const listing = publicListing(e),
    live = e.status === "published";
  if (channel === "Luma") {
    const payload: any = {
      name: live ? e.title : "Cancelled: " + e.title,
      description_md: live
        ? listing.description
        : "This gathering is no longer available. Please check " +
          ORIGIN +
          " for upcoming events.\n\n" +
          listing.description,
      start_at: e.starts_at,
      end_at: e.ends_at,
      timezone: "Asia/Dubai",
      geo_address_json: {
        type: "manual",
        address: e.area + ", Abu Dhabi, UAE",
      },
      location_visibility: "guests-only",
      show_guest_list: false,
      max_capacity: e.capacity,
      registration_open: live,
      visibility: e.status === "draft" ? "private" : "public",
    };
    if (!externalId) {
      payload.slug = "fh-" + String(e.id).replaceAll("-", "");
      payload.ticket_types = [
        { name: "Membership request", type: "free", require_approval: true },
      ];
      payload.pending_approval_email_md =
        "Your request is pending. Apply for Founder House membership and reserve your place at " +
        listing.url +
        ". This request does not confirm admission.";
    } else payload.event_id = externalId;
    const b = await requestJson(
      fetcher,
      "https://public-api.luma.com/v1/events/" +
        (externalId ? "update" : "create"),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-luma-api-key": c.lumaKey!,
        },
        body: JSON.stringify(payload),
      },
    );
    const id = b.event?.api_id ?? b.event?.id ?? externalId,
      url = validExternalUrl(channel, b.event?.url);
    if (!id)
      throw new PublishError(
        "Luma did not return an event ID. Check the calendar before retrying.",
        true,
      );
    await checkpoint(String(id), url);
    return {
      status: live ? "published" : "synced",
      external_id: String(id),
      external_url: url,
      message: live
        ? "Published with approval required. Founder House confirms final admission."
        : "Registration closed and listing updated. No event deletion or refunds were performed.",
    };
  }
  if (channel === "Meetup") {
    async function mutate(
      operation: "createEvent" | "editEvent",
      input: Record<string, unknown>,
    ) {
      const query = `mutation($input: ${operation === "createEvent" ? "CreateEventInput" : "EditEventInput"}!) { ${operation}(input: $input) { event { id eventUrl } errors { code message field } } }`;
      const b = await requestJson(fetcher, "https://api.meetup.com/gql-ext", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + c.meetupToken,
        },
        body: JSON.stringify({ query, variables: { input } }),
      });
      if (b.errors?.length || b.data?.[operation]?.errors?.length)
        throw new PublishError(
          "Meetup rejected the event fields or permissions. Review the organiser account.",
        );
      const event = b.data?.[operation]?.event;
      if (!event?.id)
        throw new PublishError(
          "Meetup did not confirm the event. Check the group before retrying.",
          true,
        );
      return event;
    }
    let id = externalId,
      url: string | undefined;
    const details = {
      title: live ? e.title : "Cancelled: " + e.title,
      description: live
        ? listing.description
        : "This gathering is no longer available. Check " +
          ORIGIN +
          " for upcoming events.\n\n" +
          listing.description,
      startDateTime: e.starts_at,
      duration:
        "PT" +
        Math.ceil(
          (new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime()) /
            60000,
        ) +
        "M",
    };
    if (!id) {
      const draft = await mutate("createEvent", {
        groupUrlname: c.meetupGroup,
        ...details,
        ...(c.meetupPublicVenueId ? { venueId: c.meetupPublicVenueId } : {}),
        publishStatus: "DRAFT",
      });
      id = String(draft.id);
      url = validExternalUrl(channel, draft.eventUrl);
      await checkpoint(id, url);
    }
    const updated = await mutate("editEvent", {
      eventId: id,
      ...details,
      publishStatus: live ? "PUBLISHED" : "DRAFT",
    });
    url = validExternalUrl(channel, updated.eventUrl) ?? url;
    return {
      status: live ? "published" : "synced",
      external_id: id,
      external_url: url,
      message: live
        ? "Published. Meetup RSVP does not grant Founder House admission."
        : "Listing returned to draft. Review any existing Meetup RSVPs separately.",
    };
  }
  const webhook = new URL(c.publishWebhook!);
  if (
    webhook.protocol !== "https:" ||
    webhook.username ||
    webhook.password ||
    !c.publishSecret
  )
    throw new PublishError(
      "The publishing workflow must use HTTPS and a shared secret.",
    );
  const key = e.publication_key + ":" + channel;
  const b = await requestJson(fetcher, webhook.href, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + c.publishSecret,
      "idempotency-key": key,
    },
    body: JSON.stringify({
      version: 1,
      idempotencyKey: key,
      channel,
      action: live ? (externalId ? "update" : "publish") : "withdraw",
      externalId,
      event: listing,
      registrationUrl: listing.url,
      requiresMemberApproval: true,
    }),
  });
  const url = validExternalUrl(channel, b.external_url),
    id = typeof b.external_id === "string" ? b.external_id : externalId;
  if ((b.status === "published" || b.status === "synced") && id && url)
    return {
      status: live ? "published" : "synced",
      external_id: id,
      external_url: url,
    };
  return {
    status: "accepted",
    external_id: id,
    external_url: url,
    message:
      "Workflow received the request. External publication is not confirmed; check the channel and record its listing receipt.",
  };
}
