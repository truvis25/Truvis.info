-- Phase 6 launch hardening: cover all foreign keys flagged by the Supabase
-- performance advisor (unindexed_foreign_keys). Read-heavy joins (profiles,
-- registrations, applications, messages) all traverse these.
create index if not exists idx_catalog_media_item on catalog_media (item_id);
create index if not exists idx_reports_post on content_reports (post_id);
create index if not exists idx_reports_reporter on content_reports (reporter_id);
create index if not exists idx_reports_resolved_by on content_reports (resolved_by);
create index if not exists idx_registrations_user on event_registrations (user_id);
create index if not exists idx_registrations_decided_by on event_registrations (decided_by);
create index if not exists idx_events_org on events (org_id);
create index if not exists idx_applications_applicant on listing_applications (applicant_id);
create index if not exists idx_applications_decided_by on listing_applications (decided_by);
create index if not exists idx_messages_application on listing_messages (application_id);
create index if not exists idx_messages_sender on listing_messages (sender_id);
create index if not exists idx_listings_created_by on marketplace_listings (created_by);
create index if not exists idx_listings_org on marketplace_listings (org_id);
create index if not exists idx_follows_user on org_follows (user_id);
create index if not exists idx_members_user on org_members (user_id);
create index if not exists idx_posts_created_by on posts (created_by);
create index if not exists idx_subscriptions_plan on subscriptions (plan_id);
create index if not exists idx_subscriptions_user on subscriptions (user_id);
