-- Existing RLS still restricts which profile a caller can edit. Administrator
-- assignment must only happen through trusted server/database administration.
revoke insert, update, truncate, references, trigger
  on public.user_profiles from public, anon, authenticated;
grant insert (id, display_name, avatar_url, compliance_subject, created_at, updated_at)
  on public.user_profiles to authenticated;
grant update (display_name, avatar_url, compliance_subject, updated_at)
  on public.user_profiles to authenticated;
