-- Delivery metadata only. Never store invitation tokens, message bodies or SMTP credentials.
create table public.fh_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  application_id text references public.fh_applications(id) on delete set null,
  kind text not null check (kind in ('application_received','member_invitation','test')),
  recipient text not null,
  status text not null check (status in ('sending','accepted','not_configured','suppressed','failed','unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fh_email_deliveries_created on public.fh_email_deliveries(created_at desc);
create index fh_email_deliveries_application on public.fh_email_deliveries(application_id);
alter table public.fh_email_deliveries enable row level security;
revoke all on public.fh_email_deliveries from public, anon, authenticated;
grant all on public.fh_email_deliveries to service_role;
