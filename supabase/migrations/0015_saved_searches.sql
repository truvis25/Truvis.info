-- Saved searches + match alerts (PRD MKT-6, DIR "saved searches").
--
-- A user saves a directory or marketplace search; a daily digest re-runs it and
-- emails only genuinely-new matches. seen_keys records the result keys already
-- notified (org slugs for directory, listing ids for marketplace) so the first
-- digest never blasts the whole existing result set — it's seeded at save time.

create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles (id) on delete cascade,
  kind text not null check (kind in ('directory', 'marketplace')),
  label text not null,
  params jsonb not null default '{}',
  seen_keys text[] not null default '{}',
  alerts_enabled boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

create index saved_searches_user_idx on saved_searches (user_id);

alter table saved_searches enable row level security;

-- Owner-only: users manage exclusively their own saved searches. The daily
-- digest reads them through the service role (RLS bypassed), matching the
-- other cron-side tables.
create policy "user manages own saved searches" on saved_searches for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- New Supabase projects no longer expose freshly-created tables through the
-- Data API implicitly. Grant only the authenticated role; RLS above still
-- restricts every row to its owner.
grant select, insert, update, delete on table saved_searches to authenticated;
