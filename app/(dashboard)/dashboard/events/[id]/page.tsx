import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { decideRegistration, setEventStatus, updateEvent } from "@/lib/events/actions";
import { Notice, inputCls, buttonCls, buttonGhostCls } from "@/components/form-field";

export const metadata: Metadata = { title: "Manage event" };

type Registration = {
  id: string;
  status: string;
  created_at: string;
  user_profiles: { display_name: string } | null;
};

const statusOrder = ["pending", "approved", "waitlisted", "rejected", "cancelled"];

export default async function ManageEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/events/${id}`);
  const org = await getManagedOrg(supabase, user.id);
  if (!org) redirect("/dashboard");

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title, description, venue_address, online_url, status, starts_at, ends_at, capacity, registration_deadline, approval_mode, luma_publish")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!event) notFound();

  // datetime-local prefill (UTC-based, matching how the create form stores values)
  const toLocalInput = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : "";

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("id, status, created_at, user_profiles(display_name)")
    .eq("event_id", event.id)
    .order("created_at");

  const regs = ((registrations ?? []) as unknown as Registration[]).sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  );
  const approvedCount = regs.filter((r) => r.status === "approved").length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/dashboard/events" className="text-sm text-muted-foreground underline underline-offset-4">
          ← Events
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">{event.title}</h1>
          <span className="text-sm text-muted-foreground">
            {event.status} ·{" "}
            {new Date(event.starts_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>
        <div className="mt-2 flex gap-3 text-sm">
          <Link href={`/events/${event.slug}`} className="underline underline-offset-4">
            View public page
          </Link>
          {event.status === "draft" ? (
            <form action={setEventStatus}>
              <input type="hidden" name="id" value={event.id} />
              <input type="hidden" name="status" value="published" />
              <button className="underline underline-offset-4">Publish</button>
            </form>
          ) : null}
        </div>
      </div>

      <Notice error={error} saved={saved} />

      {/* Edit event (EVT-1) */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display font-semibold">Edit event</h2>
        <form action={updateEvent} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={event.id} />
          <label className="flex flex-col gap-1 text-sm font-medium">
            Title
            <input name="title" required maxLength={160} defaultValue={event.title} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Description
            <textarea name="description" rows={4} maxLength={5000} defaultValue={event.description ?? ""} className={inputCls} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Starts
              <input name="starts_at" type="datetime-local" required defaultValue={toLocalInput(event.starts_at)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Ends
              <input name="ends_at" type="datetime-local" required defaultValue={toLocalInput(event.ends_at)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Venue address
              <input name="venue_address" maxLength={240} defaultValue={event.venue_address ?? ""} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Online URL
              <input name="online_url" type="url" defaultValue={event.online_url ?? ""} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Capacity
              <input name="capacity" type="number" min={1} defaultValue={event.capacity ?? ""} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Registration deadline
              <input name="registration_deadline" type="datetime-local" defaultValue={toLocalInput(event.registration_deadline)} className={inputCls} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Attendance approval
            <select name="approval_mode" defaultValue={event.approval_mode} className={inputCls}>
              <option value="manual">Manual — I approve each attendee</option>
              <option value="auto">Automatic — first come, first served</option>
            </select>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="luma_publish"
              defaultChecked={Boolean(event.luma_publish)}
              className="mt-1"
            />
            <span>
              Also publish on Luma (Truvis community calendar). Registration
              stays on Truvis.
            </span>
          </label>
          <button type="submit" className={`${buttonCls} self-start`}>Save changes</button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display font-semibold">
          Registrations ({regs.length}) — approved {approvedCount}
          {event.capacity ? ` / ${event.capacity}` : ""}
        </h2>
        {regs.map((reg) => (
          <div
            key={reg.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-5 py-4"
          >
            <div>
              <p className="font-medium">
                {reg.user_profiles?.display_name || "Registered user"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(reg.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                {" · "}
                <span
                  className={
                    reg.status === "approved"
                      ? "text-emerald-dark"
                      : reg.status === "pending"
                        ? "text-amber-600"
                        : ""
                  }
                >
                  {reg.status}
                </span>
              </p>
            </div>
            {reg.status === "pending" ? (
              <div className="flex items-center gap-2">
                <form action={decideRegistration}>
                  <input type="hidden" name="registration_id" value={reg.id} />
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button className={buttonGhostCls}>Approve</button>
                </form>
                <form action={decideRegistration}>
                  <input type="hidden" name="registration_id" value={reg.id} />
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <button className={`${buttonGhostCls} text-destructive`}>
                    Reject
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
        {!regs.length ? (
          <p className="text-sm text-muted-foreground">
            No registrations yet.
          </p>
        ) : null}
      </section>
    </main>
  );
}
