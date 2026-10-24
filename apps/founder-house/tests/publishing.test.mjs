import assert from "node:assert/strict";
import {
  publishChannel,
  channelConfig,
  publicListing,
  validExternalUrl,
  PublishError,
} from "../../../supabase/functions/founder-house/publishing.ts";
import {
  publicationHash,
  distributeEvent,
} from "../../../supabase/functions/founder-house/distribution.ts";
import { calendarFeed, foldLine } from "../lib/calendar.ts";
const event = {
  id: "12345678-1234-1234-1234-123456789012",
  title: "Founder Breakfast",
  format: "Breakfast",
  description: "Talk over coffee.",
  area: "Al Maryah Island",
  venue: "PRIVATE VENUE",
  starts_at: "2027-01-02T05:00:00Z",
  ends_at: "2027-01-02T06:00:00Z",
  capacity: 12,
  status: "published",
  publication_key: "test-key",
};
const response = (b) =>
  new Response(JSON.stringify(b), {
    headers: { "content-type": "application/json" },
  });
let count = 0;
async function check(name, fn) {
  await fn();
  count++;
  console.log("PASS " + name);
}
await check(
  "publication payload excludes private venue and credentials",
  () => {
    const listing = publicListing({ ...event, member_token_hash: "PRIVATE" });
    assert.ok(!JSON.stringify(listing).includes("PRIVATE"));
    assert.ok(listing.description.includes("/events/" + event.id));
  },
);
await check("Luma event requires approval and uses a stable slug", async () => {
  let body;
  const receipt = await publishChannel(
    "Luma",
    event,
    { lumaKey: "test" },
    undefined,
    async () => {},
    async (url, init) => {
      assert.ok(url.endsWith("/create"));
      body = JSON.parse(init.body);
      return response({
        event: { api_id: "evt-1", url: "https://luma.com/fh-test" },
      });
    },
  );
  assert.equal(receipt.status, "published");
  assert.equal(body.ticket_types[0].require_approval, true);
  assert.equal(body.show_guest_list, false);
  assert.equal(body.slug, "fh-" + event.id.replaceAll("-", ""));
  assert.ok(!JSON.stringify(body).includes("PRIVATE"));
});
await check(
  "Luma changes reuse stored event IDs and close cancelled registration",
  async () => {
    await publishChannel(
      "Luma",
      { ...event, status: "cancelled" },
      { lumaKey: "test" },
      "evt-1",
      async () => {},
      async (url, init) => {
        assert.ok(url.endsWith("/update"));
        const body = JSON.parse(init.body);
        assert.equal(body.event_id, "evt-1");
        assert.equal(body.registration_open, false);
        assert.ok(body.name.startsWith("Cancelled:"));
        return response({});
      },
    );
  },
);
await check("Meetup draft ID is persisted before publication", async () => {
  let saved = false,
    calls = 0;
  const receipt = await publishChannel(
    "Meetup",
    event,
    { meetupToken: "test", meetupGroup: "founder-house" },
    undefined,
    async (id) => {
      assert.equal(id, "meetup-1");
      saved = true;
    },
    async (url, init) => {
      const body = JSON.parse(init.body);
      calls++;
      if (calls === 1) {
        assert.equal(body.variables.input.publishStatus, "DRAFT");
        assert.equal(body.variables.input.duration, "PT60M");
        return response({
          data: {
            createEvent: {
              event: {
                id: "meetup-1",
                eventUrl: "https://www.meetup.com/fh/events/1/",
              },
              errors: [],
            },
          },
        });
      }
      assert.ok(saved);
      assert.equal(body.variables.input.eventId, "meetup-1");
      return response({
        data: {
          editEvent: {
            event: {
              id: "meetup-1",
              eventUrl: "https://www.meetup.com/fh/events/1/",
            },
            errors: [],
          },
        },
      });
    },
  );
  assert.equal(receipt.external_id, "meetup-1");
  assert.equal(calls, 2);
});
await check("HTTP 200 with GraphQL errors is a failure", async () => {
  await assert.rejects(
    () =>
      publishChannel(
        "Meetup",
        event,
        { meetupToken: "test", meetupGroup: "fh" },
        "1",
        async () => {},
        async () => response({ errors: [{ message: "Access denied" }] }),
      ),
    PublishError,
  );
});
await check("workflow acceptance never counts as published", async () => {
  const receipt = await publishChannel(
    "Eventbrite",
    event,
    { publishWebhook: "https://example.test/hook", publishSecret: "test" },
    undefined,
    async () => {},
    async (url, init) => {
      assert.equal(init.headers["idempotency-key"], "test-key:Eventbrite");
      assert.ok(!init.body.includes("PRIVATE"));
      return response({ accepted: true });
    },
  );
  assert.equal(receipt.status, "accepted");
});
await check(
  "a valid platform receipt is required to confirm publication",
  async () => {
    const receipt = await publishChannel(
      "Eventbrite",
      event,
      { publishWebhook: "https://example.test/hook", publishSecret: "test" },
      undefined,
      async () => {},
      async () =>
        response({
          status: "published",
          external_id: "123",
          external_url: "https://www.eventbrite.com/e/founder-house-123",
        }),
    );
    assert.equal(receipt.status, "published");
  },
);
await check("workflow requires a shared secret", () =>
  assert.equal(
    channelConfig({ publishWebhook: "https://example.test" }).find(
      (c) => c.name === "Eventbrite",
    ).connected,
    false,
  ),
);
await check("unsafe and wrong-platform receipt URLs rejected", () => {
  assert.equal(validExternalUrl("Luma", "javascript:alert(1)"), undefined);
  assert.equal(
    validExternalUrl("Luma", "https://luma.com.attacker.test/foo"),
    undefined,
  );
  assert.equal(
    validExternalUrl("Luma", "https://user:password@luma.com/foo"),
    undefined,
  );
  assert.equal(
    validExternalUrl("Meetup", "https://www.meetup.com/fh/events/1/"),
    "https://www.meetup.com/fh/events/1/",
  );
});
await check(
  "unknown network outcome requires review before retry",
  async () => {
    await assert.rejects(
      () =>
        publishChannel(
          "Luma",
          event,
          { lumaKey: "test" },
          undefined,
          async () => {},
          async () => {
            throw Error("network timeout");
          },
        ),
      (e) => e instanceof PublishError && e.uncertain,
    );
  },
);
await check(
  "version changes only when public event fields change",
  async () => {
    assert.equal(
      await publicationHash(event),
      await publicationHash({ ...event, venue: "OTHER PRIVATE" }),
    );
    assert.notEqual(
      await publicationHash(event),
      await publicationHash({ ...event, title: "New title" }),
    );
  },
);
await check(
  "calendar includes cancellation, stable UID and no private venue",
  () => {
    const body = calendarFeed(
      [{ ...event, status: "cancelled" }],
      "2026-10-24T00:00:00Z",
    );
    assert.ok(body.includes("STATUS:CANCELLED"));
    assert.ok(body.includes("UID:" + event.id + "@house.truvis.info"));
    assert.ok(!body.includes("PRIVATE"));
    assert.ok(body.includes("DTSTART:20270102T050000Z"));
  },
);
await check("calendar folds Unicode lines by UTF-8 bytes", () => {
  const lines = foldLine("SUMMARY:" + "سلام، welcome ".repeat(20)).split(
    "\r\n",
  );
  assert.ok(lines.length > 1);
  assert.ok(lines.every((line) => Buffer.byteLength(line) <= 75));
  assert.ok(!lines.join("").includes("\ufffd"));
});
function database(initial = []) {
  const jobs = structuredClone(initial);
  return {
    jobs,
    from(table) {
      let filters = [],
        kind = "select",
        input = null;
      const api = {
        select() {
          return api;
        },
        eq(k, v) {
          filters.push([k, v]);
          return api;
        },
        maybeSingle() {
          return execute(true);
        },
        single() {
          return execute(true);
        },
        update(v) {
          kind = "update";
          input = v;
          return api;
        },
        insert(v) {
          kind = "insert";
          input = v;
          return api;
        },
        upsert(v) {
          kind = "upsert";
          input = v;
          return api;
        },
        then(resolve, reject) {
          return execute(false).then(resolve, reject);
        },
      };
      async function execute(single) {
        const rows = table === "fh_events" ? [event] : jobs;
        const matching = rows.filter((r) =>
          filters.every(([k, v]) => r[k] === v),
        );
        if (kind === "insert" || kind === "upsert") {
          const existing = jobs.find(
            (j) => j.event_id === input.event_id && j.channel === input.channel,
          );
          if (existing && kind === "insert")
            return { data: null, error: { code: "23505" } };
          if (existing) Object.assign(existing, input);
          else jobs.push({ id: crypto.randomUUID(), ...input });
          return { data: null, error: null };
        }
        if (kind === "update") matching.forEach((r) => Object.assign(r, input));
        return { data: single ? (matching[0] ?? null) : matching, error: null };
      }
      return api;
    },
  };
}
await check(
  "disconnected channels are recorded without publication or duplicate rows",
  async () => {
    const db = database();
    const result = await distributeEvent(db, {}, event.id);
    assert.equal(result.results.length, 4);
    assert.ok(result.results.every((r) => r.status === "not_connected"));
    assert.equal(db.jobs.length, 4);
    await distributeEvent(db, {}, event.id);
    assert.equal(db.jobs.length, 4);
  },
);
await check("confirmed publication is never sent twice", async () => {
  const db = database([
    {
      id: "1",
      event_id: event.id,
      channel: "Luma",
      status: "published",
      payload_hash: await publicationHash(event),
      external_id: "evt-1",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ]);
  const result = await distributeEvent(db, { lumaKey: "test" }, event.id);
  assert.equal(
    result.results.find((r) => r.channel === "Luma").status,
    "published",
  );
  assert.equal(db.jobs.find((j) => j.channel === "Luma").attempts, undefined);
});
await check("uncertain attempt is never blindly retried", async () => {
  const db = database([
    {
      id: "1",
      event_id: event.id,
      channel: "Luma",
      status: "needs_review",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ]);
  const result = await distributeEvent(db, { lumaKey: "test" }, event.id);
  assert.equal(
    result.results.find((r) => r.channel === "Luma").status,
    "needs_review",
  );
});
console.log(
  count +
    " publication, privacy and calendar checks passed. No external accounts were called.",
);
