-- Hardening from Supabase security advisors:
--  1. Pin search_path on every function (mutable search_path lint).
--  2. Remove PostgREST-exposed EXECUTE on internal functions. RLS helper
--     functions (is_org_member, is_platform_admin, has_active_subscription)
--     stay executable — policies evaluate them as the querying role, and they
--     only reveal facts about the caller themselves.
--     claim_organization stays authenticated-callable by design (see 0002/0003).

alter function slugify(text) set search_path = public;
alter function compute_org_visibility(uuid) set search_path = public;
alter function recompute_org_visibility() set search_path = public;
alter function recompute_all_visibility() set search_path = public;
alter function is_org_member(uuid, org_role) set search_path = public;
alter function is_platform_admin() set search_path = public;
alter function has_active_subscription() set search_path = public;

-- Internal-only functions: not callable through the public API.
-- (Triggers still fire — trigger execution does not require EXECUTE for the caller.)
revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function recompute_org_visibility() from public, anon, authenticated;
revoke execute on function recompute_all_visibility() from public, anon, authenticated;
grant execute on function recompute_all_visibility() to service_role;
