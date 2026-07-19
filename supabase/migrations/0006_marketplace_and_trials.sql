-- Phase 4: subscription plans, pre-Stripe trials, and secure marketplace
-- detail access (PRD SUB-1/SUB-3, MKT-2/MKT-4).

-- ---------------------------------------------------------------------------
-- Plan catalog. Stripe price IDs are placeholders until Stripe goes live;
-- the trial plan exists so the marketplace is fully usable pre-billing.
-- ---------------------------------------------------------------------------
insert into subscription_plans (id, name, stripe_price_id, interval, active) values
  ('buyer_pro_monthly', 'Buyer/Investor Pro (monthly)', 'price_pending_stripe_monthly', 'month', true),
  ('buyer_pro_annual',  'Buyer/Investor Pro (annual)',  'price_pending_stripe_annual',  'year',  true),
  ('buyer_pro_trial',   'Buyer/Investor Pro (trial)',   'trial', 'month', true)
on conflict (id) do nothing;

-- Trials must actually expire: tighten the entitlement helper so 'trialing'
-- only counts while current_period_end is in the future.
create or replace function has_active_subscription()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from subscriptions s
    where s.user_id = auth.uid()
      and (s.status = 'active'
           or (s.status = 'trialing' and s.current_period_end > now())
           or (s.status = 'past_due'
               and s.current_period_end > now() - interval '7 days'))
  )
$$;

-- ---------------------------------------------------------------------------
-- Self-serve 14-day trial (replaced by Stripe Checkout at billing go-live;
-- one subscription record per user, ever).
-- ---------------------------------------------------------------------------
create or replace function start_trial()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from subscriptions where user_id = v_user) then
    raise exception 'you already have a subscription record';
  end if;

  insert into subscriptions (user_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end)
  values (v_user, 'buyer_pro_trial', 'trial:' || v_user, 'trial:' || v_user, 'trialing', now() + interval '14 days');

  insert into audit_log (actor_id, actor_type, action, entity_type, entity_id)
  values (v_user, 'user', 'subscription.trial.started', 'subscription', v_user::text);
end;
$$;

revoke execute on function start_trial() from public, anon;
grant execute on function start_trial() to authenticated;

-- ---------------------------------------------------------------------------
-- Marketplace detail access (MKT-2/MKT-4): detail columns are not selectable
-- through the API; this RPC is the single gate. Allowed viewers:
--   * members of the listing organization
--   * subscribers with an APPROVED application for this listing
--   * platform admins
-- Approved subscribers also learn the organization identity here.
-- ---------------------------------------------------------------------------
create or replace function get_listing_detail(p_listing_id uuid)
returns table (
  listing_id uuid,
  detail_memorandum jsonb,
  amount_sought numeric,
  equity_percent numeric,
  financial_snapshot jsonb,
  org_legal_name text,
  org_slug text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_listing marketplace_listings%rowtype;
begin
  select * into v_listing from marketplace_listings where id = p_listing_id;
  if v_listing.id is null then
    raise exception 'listing not found';
  end if;

  if not (
    is_org_member(v_listing.org_id)
    or is_platform_admin()
    or (has_active_subscription() and exists (
          select 1 from listing_applications a
          where a.listing_id = p_listing_id
            and a.applicant_id = auth.uid()
            and a.status = 'approved'))
  ) then
    raise exception 'not authorized to view listing detail';
  end if;

  return query
  select v_listing.id, v_listing.detail_memorandum, v_listing.amount_sought,
         v_listing.equity_percent, v_listing.financial_snapshot,
         o.legal_name, o.slug
  from organizations o
  where o.id = v_listing.org_id;
end;
$$;

revoke execute on function get_listing_detail(uuid) from public, anon;
grant execute on function get_listing_detail(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Display names are public profile information: organizers and listing owners
-- need to see who registered/applied (events and applications joins).
-- ---------------------------------------------------------------------------
create policy "authenticated read profiles" on user_profiles
  for select to authenticated using (true);
