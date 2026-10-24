export const ROLES = new Set([
  "Founder",
  "Startup team",
  "Angel investor",
  "VC",
  "Family office",
  "Ecosystem operator",
]);
export const INTERESTS = new Set([
  "Breakfasts",
  "Founder circles",
  "Investor conversations",
  "Padel",
  "Football",
  "Volleyball",
  "UAE market entry",
]);
export const MAX_CV_BYTES = 3 * 1024 * 1024;
const clean = (f: FormData, key: string, max = 1500) =>
  String(f.get(key) ?? "")
    .trim()
    .slice(0, max);
export function applicationData(f: FormData) {
  const data = {
    name: clean(f, "name", 100),
    email: clean(f, "email", 254).toLowerCase(),
    phone: clean(f, "phone", 30),
    role: clean(f, "role", 50),
    organisation: clean(f, "organisation", 150),
    title: clean(f, "title", 100),
    city: clean(f, "city", 100),
    linkedin: clean(f, "linkedin", 400) || null,
    about: clean(f, "about"),
    offer: clean(f, "offer"),
    ask: clean(f, "ask") || null,
    interests: [
      ...new Set(
        f
          .getAll("interests")
          .map(String)
          .filter((i) => INTERESTS.has(i)),
      ),
    ],
    referral: clean(f, "referral", 150) || null,
    source: clean(f, "source", 50) || null,
    consent_version: "2026-10-24",
    updates_consent: f.get("updates") === "on",
  };
  if (
    data.name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    !/^\+?[\d ()-]{7,30}$/.test(data.phone) ||
    !ROLES.has(data.role) ||
    data.organisation.length < 2 ||
    data.title.length < 2 ||
    data.city.length < 2 ||
    data.about.length < 30 ||
    data.offer.length < 20 ||
    !data.interests.length ||
    f.get("consent") !== "on"
  )
    throw Error(
      "Please complete your details, interests, introduction and consent.",
    );
  if (data.linkedin) {
    let u: URL;
    try {
      u = new URL(data.linkedin);
    } catch {
      throw Error("Please enter a valid personal LinkedIn URL.");
    }
    if (
      u.protocol !== "https:" ||
      !/(^|\.)linkedin\.com$/.test(u.hostname) ||
      !u.pathname.startsWith("/in/")
    )
      throw Error("Use a personal https://www.linkedin.com/in/ profile.");
  }
  return data;
}
export function publicEvent<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(
    [
      "id",
      "title",
      "format",
      "description",
      "starts_at",
      "ends_at",
      "capacity",
      "area",
      "status",
    ].map((k) => [k, row[k]]),
  );
}
export function eventData(b: Record<string, unknown>) {
  const start = new Date(String(b.startsAt)),
    end = new Date(String(b.endsAt));
  if (
    typeof b.title !== "string" ||
    b.title.length < 3 ||
    b.title.length > 150 ||
    typeof b.description !== "string" ||
    !b.description ||
    b.description.length > 4000 ||
    typeof b.venue !== "string" ||
    !b.venue ||
    b.venue.length > 300 ||
    typeof b.area !== "string" ||
    !b.area ||
    b.area.length > 100 ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start >= end ||
    start.getTime() < Date.now() ||
    !Number.isInteger(b.capacity) ||
    Number(b.capacity) < 2 ||
    Number(b.capacity) > 300 ||
    !["draft", "published"].includes(String(b.status))
  )
    throw Error(
      "Check the future dates, venue, description and capacity (2–300).",
    );
  return {
    title: b.title,
    description: b.description,
    format: String(b.format || "Founder circle").slice(0, 80),
    venue: b.venue,
    area: b.area,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    capacity: Number(b.capacity),
    status: b.status,
  };
}
