-- Founder House uses the existing TRUVIS.info database, Auth and platform_admin role.
-- New application data is private and accessed through its project-bound Edge Function.
create table public.fh_applications (
 id text primary key, name text not null, email text not null unique check(email=lower(email)), phone text not null,
 role text not null check(role in ('Founder','Startup team','Angel investor','VC','Family office','Ecosystem operator')),
 organisation text not null, title text not null, city text not null, linkedin text, cv_key text,
 about text not null check(length(about) between 30 and 1500), offer text not null check(length(offer) between 20 and 1500), ask text,
 interests jsonb not null, referral text, source text, consent_version text not null, updates_consent boolean not null default false,
 status text not null default 'pending' check(status in ('pending','approved','waitlisted','declined')),
 profile_id uuid references public.user_profiles(id), created_at timestamptz not null default now(), reviewed_at timestamptz,
 reviewed_by uuid references public.user_profiles(id), member_token_hash text unique, member_expires_at timestamptz
);
create table public.fh_events (
 id uuid primary key default gen_random_uuid(), title text not null, format text not null, description text not null,
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at), capacity int not null check(capacity between 2 and 300),
 area text not null, venue text not null, status text not null default 'draft' check(status in ('draft','published','cancelled')),
 created_by uuid references public.user_profiles(id), created_at timestamptz not null default now()
);
create table public.fh_rsvps (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.fh_events(id) on delete cascade,
 member_id text not null references public.fh_applications(id) on delete cascade,
 status text not null check(status in ('confirmed','waitlisted','cancelled')), created_at timestamptz not null default now(), unique(event_id,member_id)
);
create table public.fh_distribution_jobs (
 id uuid primary key default gen_random_uuid(),event_id uuid not null references public.fh_events(id) on delete cascade,
 channel text not null,status text not null,external_url text,external_id text,message text,updated_at timestamptz not null default now(),unique(event_id,channel)
);
create table public.fh_rate_limits (id text primary key,count int not null default 1,expires_at timestamptz not null);
create index fh_applications_status_created on public.fh_applications(status,created_at desc);
create index fh_applications_profile on public.fh_applications(profile_id);
create index fh_applications_reviewer on public.fh_applications(reviewed_by);
create index fh_events_status_starts on public.fh_events(status,starts_at);
create index fh_events_creator on public.fh_events(created_by);
create index fh_rsvps_event_status_time on public.fh_rsvps(event_id,status,created_at);
create index fh_rsvps_member on public.fh_rsvps(member_id);
create index fh_rate_limits_expiry on public.fh_rate_limits(expires_at);
alter table public.fh_applications enable row level security;
alter table public.fh_events enable row level security;
alter table public.fh_rsvps enable row level security;
alter table public.fh_distribution_jobs enable row level security;
alter table public.fh_rate_limits enable row level security;
revoke all on public.fh_applications,public.fh_events,public.fh_rsvps,public.fh_distribution_jobs,public.fh_rate_limits from anon,authenticated;
grant all on public.fh_applications,public.fh_events,public.fh_rsvps,public.fh_distribution_jobs,public.fh_rate_limits to service_role;

-- SECURITY INVOKER and service_role-only execution. No public privileged RPC.
create function public.fh_take_rate_slot(p_key text,p_limit int default 8) returns boolean
language plpgsql security invoker set search_path='' as $$
declare v_count int;
begin
 if p_limit not between 1 and 500 then raise exception 'invalid limit'; end if;
 insert into public.fh_rate_limits(id,count,expires_at) values(p_key,1,date_trunc('hour',now())+interval '1 hour')
 on conflict(id) do update set count=public.fh_rate_limits.count+1 returning count into v_count;
 return v_count<=p_limit;
end;$$;

create function public.fh_reserve_event(p_event_id uuid,p_member_hash text,p_cancel boolean default false) returns text
language plpgsql security invoker set search_path='' as $$
declare v_member public.fh_applications%rowtype;v_event public.fh_events%rowtype;v_status text;v_count int;
begin
 select * into v_member from public.fh_applications where member_token_hash=p_member_hash and status='approved' and member_expires_at>now() for share;
 if v_member.id is null then raise exception 'approved membership required';end if;
 select * into v_event from public.fh_events where id=p_event_id for update;
 if v_event.id is null or v_event.status<>'published' or v_event.starts_at<=now() then raise exception 'event unavailable';end if;
 if p_cancel then
  update public.fh_rsvps set status='cancelled' where event_id=p_event_id and member_id=v_member.id;
  select count(*) into v_count from public.fh_rsvps where event_id=p_event_id and status='confirmed';
  if v_count<v_event.capacity then
   update public.fh_rsvps set status='confirmed' where id=(select r.id from public.fh_rsvps r join public.fh_applications a on a.id=r.member_id where r.event_id=p_event_id and r.status='waitlisted' and a.status='approved' and a.member_expires_at>now() order by r.created_at,r.id limit 1);
  end if;
  return 'cancelled';
 end if;
 select status into v_status from public.fh_rsvps where event_id=p_event_id and member_id=v_member.id;
 if v_status is not null and v_status<>'cancelled' then return v_status;end if;
 select count(*) into v_count from public.fh_rsvps where event_id=p_event_id and status='confirmed';
 v_status:=case when v_count<v_event.capacity then 'confirmed' else 'waitlisted' end;
 insert into public.fh_rsvps(event_id,member_id,status) values(p_event_id,v_member.id,v_status)
 on conflict(event_id,member_id) do update set status=excluded.status,created_at=now();
 return v_status;
end;$$;

create function public.fh_review_application(p_id text,p_status text,p_hash text,p_expires timestamptz,p_reviewer uuid) returns void
language plpgsql security invoker set search_path='' as $$
declare e record;v_count int;
begin
 if not exists(select 1 from public.user_profiles where id=p_reviewer and platform_admin) then raise exception 'organiser required';end if;
 if p_status not in ('pending','approved','waitlisted','declined') then raise exception 'invalid status';end if;
 if p_status='approved' and (p_hash is null or length(p_hash)<>64 or p_expires<=now()) then raise exception 'invalid member invitation';end if;
 update public.fh_applications set status=p_status,reviewed_at=now(),reviewed_by=p_reviewer,member_token_hash=case when p_status='approved' then p_hash else null end,member_expires_at=case when p_status='approved' then p_expires else null end where id=p_id;
 if not found then raise exception 'application not found';end if;
 if p_status<>'approved' then
  for e in select ev.id,ev.capacity from public.fh_events ev join public.fh_rsvps r on r.event_id=ev.id where r.member_id=p_id and r.status='confirmed' and ev.starts_at>now() order by ev.id for update of ev loop
   update public.fh_rsvps set status='cancelled' where event_id=e.id and member_id=p_id;
   select count(*) into v_count from public.fh_rsvps where event_id=e.id and status='confirmed';
   if v_count<e.capacity then
    update public.fh_rsvps set status='confirmed' where id=(select r.id from public.fh_rsvps r join public.fh_applications a on a.id=r.member_id where r.event_id=e.id and r.status='waitlisted' and a.status='approved' and a.member_expires_at>now() order by r.created_at,r.id limit 1);
   end if;
  end loop;
  update public.fh_rsvps set status='cancelled' where member_id=p_id and status='waitlisted';
 end if;
end;$$;
revoke all on function public.fh_take_rate_slot(text,int),public.fh_reserve_event(uuid,text,boolean),public.fh_review_application(text,text,text,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.fh_take_rate_slot(text,int),public.fh_reserve_event(uuid,text,boolean),public.fh_review_application(text,text,text,timestamptz,uuid) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('founder-house-cvs','founder-house-cvs',false,3145728,array['application/pdf']);
