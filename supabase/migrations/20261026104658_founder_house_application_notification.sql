-- Distinguish the internal organiser alert from the applicant's receipt.
alter table public.fh_email_deliveries
  drop constraint fh_email_deliveries_kind_check;

alter table public.fh_email_deliveries
  add constraint fh_email_deliveries_kind_check
  check (kind in (
    'application_received',
    'application_notification',
    'member_invitation',
    'test'
  ));
