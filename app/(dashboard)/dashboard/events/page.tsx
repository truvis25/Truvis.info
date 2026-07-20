import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { createEvent, setEventStatus } from "@/lib/events/actions";
import {
  Notice,
  inputCls,
  buttonCls,
  buttonGhostCls,
} from "@/components/form-field";

export const metadata: Metadata = { title: "Events" };

type EventRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  status: string;
  approval_mode: string;
  registrations: { count: number }[];
};

export default async function EventsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/events");
  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");

  const { data: events } = await supabase
    .from("events")
    .select("id, slug, title, starts_at, status, approval_mode, registrations:event_registrations(count)")
    .eq("org_id", org.id)
    .order("starts_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Dashboard
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Published events appear on the public events page while your
          organization is visible.
        </p>
      </div>

      <Notice error={error} saved={saved} />

      <section className="rounded-2xl border border-border p-6">
        <h2 className="mb-4 font-semibold">Create an event</h2>
        <form action={createEvent} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Title
            <input name="title" required maxLength={160} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Description
            <textarea name="description" rows={4} maxLength={5000} className={inputCls} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Starts (Gulf Standard Time)
              <input name="starts_at" type="datetime-local" required className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Ends
              <input name="ends_at" type="datetime-local" required className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Venue address (optional)
              <input name="venue_address" maxLength={240} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Online URL (optional)
              <input name="online_url" type="url" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Capacity (optional)
              <input name="capacity" type="number" min={1} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Registration deadline (optional)
              <input name="registration_deadline" type="datetime-local" className={inputCls} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Attendance approval
            <select name="approval_mode" defaultValue="manual" className={inputCls}>
              <option value="manual">Manual — I approve each attendee</option>
              <option value="auto">Automatic — first come, first served</option>
            </select>
          </label>
          <button type="submit" className={`${buttonCls} self-start`}>
            Create event (draft)
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display font-semibold">Your events ({events?.length ?? 0})</h2>
        {(events as EventRow[] | null)?.map((event) => (
          <div
            key={event.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-5 py-4"
          >
            <div>
              <Link href={`/dashboard/events/${event.id}`} className="font-medium underline-offset-4 hover:underline">
                {event.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {new Date(event.starts_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                {" · "}
                <span className={event.status === "published" ? "text-emerald-dark" : ""}>{event.status}</span>
                {" · "}
                {event.registrations?.[0]?.count ?? 0} registration{(event.registrations?.[0]?.count ?? 0) === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/events/${event.id}`} className={buttonGhostCls}>
                Manage
              </Link>
              {event.status === "draft" ? (
                <form action={setEventStatus}>
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="status" value="published" />
                  <button className={buttonGhostCls}>Publish</button>
                </form>
              ) : event.status === "published" ? (
                <form action={setEventStatus}>
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className={`${buttonGhostCls} text-destructive`}>Cancel</button>
                </form>
              ) : null}
            </div>
          </div>
        ))}
        {!events?.length ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : null}
      </section>
    </main>
  );
}
