begin;
do $$
declare reviewer uuid;event_id uuid;v text;count_rows int;
begin
 select id into reviewer from public.user_profiles where platform_admin limit 1;
 if reviewer is null then raise exception 'test requires existing platform admin';end if;
 insert into public.fh_applications(id,name,email,phone,role,organisation,title,city,about,offer,interests,consent_version)
 select 'FH-TEST-'||n,'Test Founder','fh-test-'||lower(n)||'@example.test','+971 50 000 0000','Founder','Test company','Founder','Abu Dhabi','Building a startup with a meaningful test introduction.','Sharing founder experience and useful introductions.','["Breakfasts"]'::jsonb,'test-only' from unnest(array['A','B','C']) n;
 perform public.fh_review_application('FH-TEST-A','approved',repeat('a',64),now()+interval '30 days',reviewer);
 perform public.fh_review_application('FH-TEST-B','approved',repeat('b',64),now()+interval '30 days',reviewer);
 perform public.fh_review_application('FH-TEST-C','approved',repeat('c',64),now()+interval '30 days',reviewer);
 insert into public.fh_events(title,format,description,starts_at,ends_at,capacity,area,venue,status) values('Isolated test breakfast','Breakfast','Test-only gathering',now()+interval '1 day',now()+interval '1 day 1 hour',2,'Abu Dhabi','PRIVATE TEST VENUE','published') returning id into event_id;
 v:=public.fh_reserve_event(event_id,repeat('a',64));if v<>'confirmed' then raise exception 'first member not confirmed';end if;
 v:=public.fh_reserve_event(event_id,repeat('b',64));if v<>'confirmed' then raise exception 'second member not confirmed';end if;
 v:=public.fh_reserve_event(event_id,repeat('c',64));if v<>'waitlisted' then raise exception 'capacity not enforced';end if;
 v:=public.fh_reserve_event(event_id,repeat('a',64));select count(*) into count_rows from public.fh_rsvps where member_id='FH-TEST-A';if count_rows<>1 then raise exception 'duplicate RSVP';end if;
 perform public.fh_reserve_event(event_id,repeat('a',64),true);
 select status into v from public.fh_rsvps where member_id='FH-TEST-C';if v<>'confirmed' then raise exception 'waitlist promotion failed';end if;
 perform public.fh_review_application('FH-TEST-C','declined',null,null,reviewer);
 select status into v from public.fh_rsvps where member_id='FH-TEST-C';if v<>'cancelled' then raise exception 'revocation did not release seat';end if;
 if exists(select 1 from public.fh_applications where id='FH-TEST-C' and member_token_hash is not null) then raise exception 'revocation retained credential';end if;
 begin
  perform public.fh_reserve_event(event_id,repeat('c',64));raise exception 'revoked member was accepted';
 exception when raise_exception then
  if sqlerrm='revoked member was accepted' then raise;end if;
 end;
 if not public.fh_take_rate_slot('test-rate-limit',2) then raise exception 'first rate slot failed';end if;
 if not public.fh_take_rate_slot('test-rate-limit',2) then raise exception 'second rate slot failed';end if;
 if public.fh_take_rate_slot('test-rate-limit',2) then raise exception 'rate limit failed';end if;
 if has_table_privilege('anon','public.fh_applications','SELECT') then raise exception 'anonymous application read allowed';end if;
 if has_function_privilege('anon','public.fh_reserve_event(uuid,text,boolean)','EXECUTE') then raise exception 'anonymous privileged RPC allowed';end if;
 if exists(select 1 from storage.buckets where id='founder-house-cvs' and public) then raise exception 'CV bucket public';end if;
end;$$;
select 'Membership, approval, capacity, idempotence, cancellation, waitlist promotion, revocation, rate limit and anonymous-access checks passed. Test records are rolled back.' as verification;
rollback;
