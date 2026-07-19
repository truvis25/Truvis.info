import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getManagedOrg } from "@/lib/orgs/queries";
import { decideRegistration, setEventStatus } from "@/lib/events/actions";
import { Notice, buttonGhostCls } from "@/components/form-field";

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
    .select("id, slug, title, status, starts_at, capacity, approval_mode")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!event) notFound();

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
        <Link href="/dashboard/events" className="text-sm text-gray-500 underline underline-offset-4 dark:text-gray-400">
          ← Events
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
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

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">
          Registrations ({regs.length}) — approved {approvedCount}
          {event.capacity ? ` / ${event.capacity}` : ""}
        </h2>
        {regs.map((reg) => (
          <div
            key={reg.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-5 py-4 dark:border-white/15"
          >
            <div>
              <p className="font-medium">
                {reg.user_profiles?.display_name || "Registered user"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(reg.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                {" · "}
                <span
                  className={
                    reg.status === "approved"
                      ? "text-emerald-600"
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
                  <button className={`${buttonGhostCls} text-red-600 dark:text-red-400`}>
                    Reject
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
        {!regs.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No registrations yet.
          </p>
        ) : null}
      </section>
    </main>
  );
}
