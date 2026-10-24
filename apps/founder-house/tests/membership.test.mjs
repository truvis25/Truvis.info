import assert from "node:assert/strict";
import {
  applicationData,
  eventData,
  publicEvent,
  MAX_CV_BYTES,
} from "../../../supabase/functions/founder-house/validation.ts";
let n = 0;
function check(label, fn) {
  fn();
  console.log("PASS " + label);
  n++;
}
function form() {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    name: "Test Founder",
    email: "FOUNDER@example.test",
    phone: "+971 50 000 0000",
    role: "Founder",
    organisation: "Test Startup",
    title: "Co-founder",
    city: "Abu Dhabi",
    linkedin: "https://www.linkedin.com/in/test-founder",
    about: "We are building a startup for the Abu Dhabi ecosystem.",
    offer: "I can share useful founder experience and introductions.",
    consent: "on",
  }))
    f.set(k, v);
  f.append("interests", "Breakfasts");
  return f;
}
check("valid application normalises email", () =>
  assert.equal(applicationData(form()).email, "founder@example.test"),
);
check("marketing consent is optional and separate", () =>
  assert.equal(applicationData(form()).updates_consent, false),
);
check("review consent required", () => {
  const f = form();
  f.delete("consent");
  assert.throws(() => applicationData(f));
});
check("unrelated membership roles rejected", () => {
  const f = form();
  f.set("role", "Unrelated sales");
  assert.throws(() => applicationData(f));
});
check("LinkedIn hostname spoof rejected", () => {
  const f = form();
  f.set("linkedin", "https://linkedin.com.example.test/in/test");
  assert.throws(() => applicationData(f));
});
check("LinkedIn company page rejected", () => {
  const f = form();
  f.set("linkedin", "https://www.linkedin.com/company/test");
  assert.throws(() => applicationData(f));
});
check("LinkedIn HTTPS required", () => {
  const f = form();
  f.set("linkedin", "http://www.linkedin.com/in/test");
  assert.throws(() => applicationData(f));
});
check("contribution must be meaningful", () => {
  const f = form();
  f.set("offer", "Hi");
  assert.throws(() => applicationData(f));
});
check("current-work introduction must be meaningful", () => {
  const f = form();
  f.set("about", "Hi");
  assert.throws(() => applicationData(f));
});
check("event interests are filtered and deduplicated", () => {
  const f = form();
  f.append("interests", "Breakfasts");
  f.append("interests", "not-a-format");
  assert.deepEqual(applicationData(f).interests, ["Breakfasts"]);
});
check("public event serializer excludes private and internal data", () => {
  const x = publicEvent({
    id: "test",
    title: "Breakfast",
    venue: "PRIVATE",
    created_by: "PRIVATE",
    member_token_hash: "PRIVATE",
  });
  assert.ok(!("venue" in x));
  assert.ok(!("created_by" in x));
  assert.ok(!("member_token_hash" in x));
});
const event = {
  title: "Founder Breakfast",
  description: "A real breakfast.",
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  endsAt: new Date(Date.now() + 90000000).toISOString(),
  capacity: 12,
  area: "Abu Dhabi",
  venue: "Private venue",
  status: "draft",
};
check("valid event keeps dates as ISO instants", () =>
  assert.equal(eventData(event).starts_at, event.startsAt),
);
check("capacity must be a whole positive limited number", () =>
  assert.throws(() => eventData({ ...event, capacity: 1.5 })),
);
check("events cannot end before starting", () =>
  assert.throws(() => eventData({ ...event, endsAt: event.startsAt })),
);
check("past events rejected", () =>
  assert.throws(() =>
    eventData({ ...event, startsAt: "2020-01-01T00:00:00Z" }),
  ),
);
check("CV size fits Vercel request-body limits", () =>
  assert.equal(MAX_CV_BYTES, 3145728),
);
console.log(
  n +
    " membership validation and privacy checks passed. Database locking and RLS are verified separately against the shared Supabase database.",
);
