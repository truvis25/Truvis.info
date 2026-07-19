-- Phase 3: server-enforced event registration rules (PRD EVT-3/EVT-4).
-- A BEFORE INSERT trigger makes registration status trustworthy regardless of
-- what a client submits through the API:
--   * event must be published, not started, and before the deadline
--   * status is forced: 'approved' for auto-approve events (capacity checked),
--     'pending' for manual events
--   * capacity full on an auto event -> registration rejected with an error

create or replace function guard_event_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event events%rowtype;
  v_approved int;
begin
  select * into v_event from events where id = new.event_id;
  if v_event.id is null then
    raise exception 'event not found';
  end if;
  if v_event.status <> 'published' then
    raise exception 'registration is closed for this event';
  end if;
  if v_event.starts_at <= now() then
    raise exception 'this event has already started';
  end if;
  if v_event.registration_deadline is not null and v_event.registration_deadline <= now() then
    raise exception 'the registration deadline has passed';
  end if;

  if v_event.approval_mode = 'auto' then
    if v_event.capacity is not null then
      select count(*) into v_approved
      from event_registrations
      where event_id = new.event_id and status = 'approved';
      if v_approved >= v_event.capacity then
        raise exception 'this event is fully booked';
      end if;
    end if;
    new.status := 'approved';
  else
    new.status := 'pending';
  end if;

  new.decided_by := null;
  new.decided_at := null;
  return new;
end;
$$;

create trigger trg_guard_event_registration
before insert on event_registrations
for each row execute function guard_event_registration();

revoke execute on function guard_event_registration() from public, anon, authenticated;

-- Organizer approval capacity check, used by the approve action so capacity
-- is enforced under concurrency at the database rather than in app code.
create or replace function approve_registration(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg event_registrations%rowtype;
  v_event events%rowtype;
  v_approved int;
begin
  select * into v_reg from event_registrations where id = p_registration_id for update;
  if v_reg.id is null then
    raise exception 'registration not found';
  end if;
  select * into v_event from events where id = v_reg.event_id;
  if not is_org_member(v_event.org_id) then
    raise exception 'not authorized';
  end if;
  if v_event.capacity is not null then
    select count(*) into v_approved
    from event_registrations
    where event_id = v_event.id and status = 'approved';
    if v_approved >= v_event.capacity then
      raise exception 'event is at capacity';
    end if;
  end if;

  update event_registrations
     set status = 'approved', decided_by = auth.uid(), decided_at = now()
   where id = p_registration_id;

  insert into audit_log (actor_id, actor_type, action, entity_type, entity_id)
  values (auth.uid(), 'user', 'event.registration.approved', 'event_registration', p_registration_id::text);
end;
$$;

revoke execute on function approve_registration(uuid) from public, anon;
grant execute on function approve_registration(uuid) to authenticated;
