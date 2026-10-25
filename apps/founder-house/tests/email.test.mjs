import assert from "node:assert/strict";
import {
  deliverEmail,
  emailMessage,
  HOUSE_URL,
  reservedRecipient,
} from "../../../supabase/functions/founder-house/email.ts";
import { createHandler } from "../../../supabase/functions/founder-house/handler.ts";

const recipient = {
  id: "FH-TEST",
  name: '<script>alert("x")</script>',
  email: "founder@startup.dev",
};
const invitation = HOUSE_URL + "/members#access=" + "a".repeat(64);
let passed = 0;
async function check(name, test) {
  await test();
  passed++;
  console.log("PASS " + name);
}
function database({ failLog = false, failUpdate = false } = {}) {
  const applications = [],
    logs = [];
  return {
    applications,
    logs,
    auth: {
      async getUser() {
        return { data: { user: null } };
      },
    },
    async rpc() {
      return { data: true, error: null };
    },
    from(table) {
      return {
        select() {
          return {
            eq(_, value) {
              return {
                async maybeSingle() {
                  return {
                    data: applications.find((a) => a.email === value) ?? null,
                    error: null,
                  };
                },
              };
            },
          };
        },
        async insert(row) {
          if (table === "fh_email_deliveries" && failLog)
            return { error: { code: "unavailable" } };
          (table === "fh_applications" ? applications : logs).push({ ...row });
          return { error: null };
        },
        update(values) {
          return {
            async eq(_, value) {
              if (failUpdate) return { error: { code: "unavailable" } };
              Object.assign(
                logs.find((l) => l.id === value),
                values,
              );
              return { error: null };
            },
          };
        },
      };
    },
  };
}
function applicationRequest(honeypot = false) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    name: "Test founder",
    email: "founder@startup.dev",
    phone: "+1 202 555 0123",
    role: "Founder",
    organisation: "QA startup",
    title: "Founder",
    city: "Abu Dhabi",
    linkedin: "https://www.linkedin.com/in/qa-founder",
    about: "We are testing a saved membership application and email receipt.",
    offer: "We can share experience with testing and building products.",
    consent: "on",
    interests: "Breakfasts",
    website: honeypot ? "spam" : "",
  }))
    data.set(key, value);
  return new Request("https://example.test", {
    method: "POST",
    headers: { "x-fh-path": "/api/apply", "x-fh-client-ip": "test" },
    body: data,
  });
}

await check("HTML escapes applicant names; text alternative is present", () => {
  const message = emailMessage("application_received", recipient);
  assert.ok(!message.html.includes("<script>"));
  assert.ok(message.html.includes("&lt;script&gt;"));
  assert.ok(message.text.includes("FH-TEST"));
  assert.ok(
    message.text.includes(
      "membership and event places are confirmed separately",
    ),
  );
});
await check(
  "invitation accepts only the canonical host and valid token",
  () => {
    assert.ok(
      emailMessage("member_invitation", recipient, invitation).text.includes(
        invitation,
      ),
    );
    for (const url of [
      "https://attacker.test/members#access=" + "a".repeat(64),
      "javascript:alert(1)",
      HOUSE_URL + "/members#access=bad",
    ])
      assert.throws(() => emailMessage("member_invitation", recipient, url));
  },
);
await check(
  "header-injection and multiple-recipient addresses are rejected",
  () => {
    for (const email of [
      "x@example.com\r\nBcc:a@b.com",
      "a@b.com,b@b.com",
      "A <a@b.com>",
    ])
      assert.throws(() => emailMessage("test", { ...recipient, email }));
  },
);
await check("reserved QA addresses are never emailed", async () => {
  for (const email of ["qa@example.test", "qa@example.com", "qa@host.invalid"])
    assert.ok(reservedRecipient(email));
  let calls = 0;
  const result = await deliverEmail(
    database(),
    {
      configured: true,
      missing: [],
      async send() {
        calls++;
      },
    },
    "test",
    { ...recipient, email: "qa@example.test" },
  );
  assert.equal(result.status, "suppressed");
  assert.equal(calls, 0);
});
await check("missing configuration is recorded without a send", async () => {
  const db = database();
  assert.equal(
    (await deliverEmail(db, undefined, "application_received", recipient))
      .status,
    "not_configured",
  );
  assert.equal(db.logs[0].status, "not_configured");
});
await check(
  "accepted invitation is recorded without storing its token or body",
  async () => {
    const db = database();
    const result = await deliverEmail(
      db,
      {
        configured: true,
        missing: [],
        async send(message) {
          assert.ok(message.text.includes(invitation));
          return { accepted: true };
        },
      },
      "member_invitation",
      recipient,
      invitation,
    );
    assert.deepEqual(result, { status: "accepted", logged: true });
    assert.ok(!JSON.stringify(db.logs).includes("a".repeat(64)));
    assert.ok(!("html" in db.logs[0]));
  },
);
await check("provider rejection is not reported as accepted", async () => {
  assert.equal(
    (
      await deliverEmail(
        database(),
        {
          configured: true,
          missing: [],
          async send() {
            return { accepted: false };
          },
        },
        "test",
        recipient,
      )
    ).status,
    "failed",
  );
});
await check(
  "ambiguous provider failure is not retried or reported as sent",
  async () => {
    let calls = 0;
    const db = database();
    const result = await deliverEmail(
      db,
      {
        configured: true,
        missing: [],
        async send() {
          calls++;
          throw Error("timeout including secret details");
        },
      },
      "test",
      recipient,
    );
    assert.equal(result.status, "unknown");
    assert.equal(calls, 1);
    assert.ok(!JSON.stringify(db.logs).includes("secret details"));
  },
);
await check(
  "mail is not sent if the audit record cannot be created",
  async () => {
    let called = false;
    const result = await deliverEmail(
      database({ failLog: true }),
      {
        configured: true,
        missing: [],
        async send() {
          called = true;
          return { accepted: true };
        },
      },
      "test",
      recipient,
    );
    assert.deepEqual(result, { status: "failed", logged: false });
    assert.equal(called, false);
  },
);
await check(
  "accepted email remains truthful when log update fails",
  async () => {
    assert.deepEqual(
      await deliverEmail(
        database({ failUpdate: true }),
        {
          configured: true,
          missing: [],
          async send() {
            return { accepted: true };
          },
        },
        "test",
        recipient,
      ),
      { status: "accepted", logged: false },
    );
  },
);
await check(
  "receipt is sent once after save; duplicate applications stay generic",
  async () => {
    const db = database();
    let sends = 0;
    const handler = createHandler(db, {
      mailer: {
        configured: true,
        missing: [],
        async send() {
          assert.equal(db.applications.length, 1);
          sends++;
          return { accepted: true };
        },
      },
    });
    const first = await handler(applicationRequest());
    const second = await handler(applicationRequest());
    assert.equal(first.status, 202);
    assert.equal(second.status, 202);
    assert.deepEqual(await first.json(), await second.json());
    assert.equal(sends, 1);
    assert.equal(db.applications.length, 1);
  },
);
await check(
  "email outage never turns a saved application into a failure",
  async () => {
    const db = database();
    const handler = createHandler(db, {
      mailer: {
        configured: true,
        missing: [],
        async send() {
          throw Error("offline");
        },
      },
    });
    assert.equal((await handler(applicationRequest())).status, 202);
    assert.equal(db.applications.length, 1);
    assert.equal(db.logs[0].status, "unknown");
  },
);
await check("honeypot never saves or sends a receipt", async () => {
  const db = database();
  assert.equal((await createHandler(db)(applicationRequest(true))).status, 202);
  assert.equal(db.applications.length, 0);
  assert.equal(db.logs.length, 0);
});
await check(
  "anonymous visitors cannot inspect email logs or send tests",
  async () => {
    const handler = createHandler(database());
    for (const [method, path] of [
      ["GET", "/api/admin/email"],
      ["POST", "/api/admin/email/test"],
    ]) {
      assert.equal(
        (
          await handler(
            new Request("https://example.test", {
              method,
              headers: { "x-fh-path": path },
            }),
          )
        ).status,
        403,
      );
    }
  },
);
console.log(`${passed} email checks passed.`);
