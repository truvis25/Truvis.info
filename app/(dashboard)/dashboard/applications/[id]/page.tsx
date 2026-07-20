import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendListingMessage } from "@/lib/marketplace/actions";
import { inputCls, buttonCls } from "@/components/form-field";

export const metadata: Metadata = { title: "Application thread" };

// Shared thread page: readable by the applicant and the listing organization
// (RLS decides which; anyone else gets a 404).
export default async function ApplicationThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/applications/${id}`);

  const { data: application } = await supabase
    .from("listing_applications")
    .select("id, status, applicant_id, marketplace_listings(teaser_headline)")
    .eq("id", id)
    .maybeSingle();
  if (!application || application.status !== "approved") notFound();

  const { data: messages } = await supabase
    .from("listing_messages")
    .select("id, body, sender_id, created_at")
    .eq("application_id", id)
    .order("created_at");

  const listing = application.marketplace_listings as unknown as {
    teaser_headline: string;
  } | null;
  const isApplicant = application.applicant_id === user.id;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <Link
          href={isApplicant ? "/dashboard/applications" : "/dashboard/listings"}
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Back
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-petroleum dark:text-foreground">
          {listing?.teaser_headline ?? "Listing"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Private thread between the {isApplicant ? "seller and you" : "applicant and your organization"}.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {(messages ?? []).map((message) => (
          <li
            key={message.id}
            className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
              message.sender_id === user.id
                ? "self-end bg-petroleum text-white"
                : "self-start bg-secondary"
            }`}
          >
            {message.body}
            <span className="mt-1 block text-[10px] opacity-60">
              {new Date(message.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </li>
        ))}
        {!messages?.length ? (
          <li className="text-sm text-muted-foreground">
            No messages yet.
          </li>
        ) : null}
      </ul>

      <form action={sendListingMessage} className="flex gap-2">
        <input type="hidden" name="application_id" value={id} />
        <input type="hidden" name="back" value={`/dashboard/applications/${id}`} />
        <input
          name="body"
          required
          maxLength={2000}
          placeholder="Write a message…"
          className={`${inputCls} flex-1`}
        />
        <button className={buttonCls}>Send</button>
      </form>
    </main>
  );
}
