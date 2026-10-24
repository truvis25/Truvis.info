-- Each event/channel has one publication record. Compare-and-swap claims prevent
-- concurrent duplicate creates; receipts preserve IDs before subsequent API steps.
alter table public.fh_distribution_jobs
  add column payload_hash text,
  add column lock_id uuid,
  add column attempts integer not null default 0 check (attempts >= 0);
