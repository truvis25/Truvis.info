-- Phase 6: KPI metrics for the admin dashboard (BRD §9).
create or replace function admin_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not is_platform_admin() then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'users', (select count(*) from auth.users),
    'orgs_total', (select count(*) from organizations),
    'orgs_visible', (select count(*) from organizations where is_visible),
    'follows', (select count(*) from org_follows),
    'catalog_items_published', (select count(*) from catalog_items where status = 'published'),
    'posts_published', (select count(*) from posts where status = 'published'),
    'events_published', (select count(*) from events where status = 'published'),
    'event_registrations', (select count(*) from event_registrations where status <> 'cancelled'),
    'listings_active', (select count(*) from marketplace_listings where status = 'active'),
    'listing_applications', (select count(*) from listing_applications),
    'subscriptions_active', (select count(*) from subscriptions
                              where status = 'active'
                                 or (status = 'trialing' and current_period_end > now())),
    'reports_open', (select count(*) from content_reports where status = 'open')
  );
end;
$$;

revoke execute on function admin_metrics() from public, anon;
grant execute on function admin_metrics() to authenticated;
