-- Admin panel: suspend / restore members, manage the allowed-domain list from
-- the app, and daily sign-in numbers for the charts.
--
-- Runs after 20261123130000_activity_log.sql.


-- ---------------------------------------------------------------------------
-- Member status
-- ---------------------------------------------------------------------------

create type public.member_status as enum ('active', 'suspended');

alter table public.profiles
  add column status public.member_status not null default 'active';

-- Allowed domain *and* an active profile. Most read paths use this now.
create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_allowed_email((select auth.jwt() ->> 'email'))
     and exists (
       select 1
       from public.profiles
       where id = (select auth.uid())
         and status = 'active'
     );
$$;

-- A suspended admin keeps the role on paper but loses every admin power.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'active'
  );
$$;

-- Suspended members can still read their own profile row (that's how the app
-- knows to show "your access is paused"), but nothing else.
drop policy "members can read their own activity" on public.auth_events;
create policy "members can read their own activity"
  on public.auth_events
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_active_member()
  );


-- ---------------------------------------------------------------------------
-- Audit log: new event kinds. Domain events have no subject member.
-- ---------------------------------------------------------------------------

alter table public.auth_events alter column user_id drop not null;

alter table public.auth_events drop constraint auth_events_kind_check;
alter table public.auth_events add constraint auth_events_kind_check
  check (kind in ('signed_in', 'role_changed', 'status_changed', 'domain_added', 'domain_removed'));


-- ---------------------------------------------------------------------------
-- Suspend / restore
-- ---------------------------------------------------------------------------

create or replace function public.set_member_status(member_id uuid, new_status public.member_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_status public.member_status;
begin
  if not (public.is_admin() and public.is_allowed_email((select auth.jwt() ->> 'email'))) then
    raise exception 'Only admins can change access.' using errcode = '42501';
  end if;

  if member_id = (select auth.uid()) then
    raise exception 'You can''t change your own access.' using errcode = '42501';
  end if;

  select status into old_status from public.profiles where id = member_id for update;
  if not found then
    raise exception 'That member no longer exists.' using errcode = 'P0002';
  end if;

  if old_status = new_status then
    return;
  end if;

  update public.profiles set status = new_status where id = member_id;

  insert into public.auth_events (user_id, actor_id, kind, detail)
  values (
    member_id,
    (select auth.uid()),
    'status_changed',
    jsonb_build_object('from', old_status, 'to', new_status)
  );
end;
$$;


-- ---------------------------------------------------------------------------
-- Allowed domains, managed from the admin panel
-- ---------------------------------------------------------------------------

-- The app's own domain check reads this list after sign-in, so a domain an
-- admin adds here works everywhere without a redeploy.
create or replace function public.allowed_domain_list()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(domain order by created_at), '{}')
  from public.allowed_domains;
$$;

create or replace function public.admin_domains()
returns table (domain text, created_at timestamptz, members bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.is_admin() and public.is_allowed_email((select auth.jwt() ->> 'email'))) then
    raise exception 'Only admins can manage domains.' using errcode = '42501';
  end if;

  return query
    select d.domain,
           d.created_at,
           (select count(*) from public.profiles p where split_part(p.email, '@', -1) = d.domain)
    from public.allowed_domains d
    order by d.created_at;
end;
$$;

create or replace function public.add_allowed_domain(new_domain text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := regexp_replace(lower(trim(coalesce(new_domain, ''))), '^@', '');
begin
  if not (public.is_admin() and public.is_allowed_email((select auth.jwt() ->> 'email'))) then
    raise exception 'Only admins can manage domains.' using errcode = '42501';
  end if;

  if clean !~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$' then
    raise exception 'That doesn''t look like a domain. Use something like hbplus.fit.'
      using errcode = '22023';
  end if;

  -- Allowing a public mailbox provider would let anyone in. If that's ever
  -- really wanted, it has to be done deliberately in SQL, not with one click.
  if clean in ('gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
               'yahoo.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
               'zoho.com', 'yandex.com', 'gmx.com', 'mail.com', 'rediffmail.com') then
    raise exception '% is a public email provider. Allowing it would let anyone sign in.', clean
      using errcode = '22023';
  end if;

  if exists (select 1 from public.allowed_domains where domain = clean) then
    raise exception '% is already on the list.', clean using errcode = '23505';
  end if;

  insert into public.allowed_domains (domain) values (clean);

  insert into public.auth_events (actor_id, kind, detail)
  values ((select auth.uid()), 'domain_added', jsonb_build_object('domain', clean));
end;
$$;

create or replace function public.remove_allowed_domain(old_domain text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := regexp_replace(lower(trim(coalesce(old_domain, ''))), '^@', '');
begin
  if not (public.is_admin() and public.is_allowed_email((select auth.jwt() ->> 'email'))) then
    raise exception 'Only admins can manage domains.' using errcode = '42501';
  end if;

  -- Also means the list can never be emptied from the app.
  if clean = lower(split_part((select auth.jwt() ->> 'email'), '@', -1)) then
    raise exception 'You can''t remove %, your own account uses it.', clean
      using errcode = '42501';
  end if;

  delete from public.allowed_domains where domain = clean;
  if not found then
    raise exception '% isn''t on the list.', clean using errcode = 'P0002';
  end if;

  insert into public.auth_events (actor_id, kind, detail)
  values ((select auth.uid()), 'domain_removed', jsonb_build_object('domain', clean));
end;
$$;


-- ---------------------------------------------------------------------------
-- Dashboard numbers
-- ---------------------------------------------------------------------------

create or replace function public.team_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_active_member() then
    raise exception 'Access restricted.' using errcode = '42501';
  end if;

  -- "recent" is a small, deliberate directory: display name and photo of the
  -- six most recently active people. No emails, no roles.
  return jsonb_build_object(
    'members',     (select count(*) from public.profiles where status = 'active'),
    'admins',      (select count(*) from public.profiles where role = 'admin' and status = 'active'),
    'suspended',   (select count(*) from public.profiles where status = 'suspended'),
    'active_week', (select count(*) from public.profiles
                     where status = 'active' and last_sign_in_at > now() - interval '7 days'),
    'domains',     (select count(*) from public.allowed_domains),
    'recent', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', r.id,
                 'name', r.name,
                 'avatar_url', r.avatar_url,
                 'last_sign_in_at', r.last_sign_in_at
               )
               order by r.last_sign_in_at desc nulls last
             )
      from (
        select id,
               coalesce(full_name, split_part(email, '@', 1)) as name,
               avatar_url,
               last_sign_in_at
        from public.profiles
        where status = 'active'
        order by last_sign_in_at desc nulls last
        limit 6
      ) r
    ), '[]'::jsonb)
  );
end;
$$;

-- Daily sign-ins for the charts. Admins get the whole team, everyone else
-- only their own. Days are bucketed in the caller's time zone so "today"
-- means today for them.
create or replace function public.sign_ins_by_day(days integer default 14, tz text default 'UTC')
returns table (bucket date, sign_ins bigint, people bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  span integer := least(greatest(coalesce(days, 14), 1), 90);
  see_all boolean;
begin
  if not public.is_active_member() then
    raise exception 'Access restricted.' using errcode = '42501';
  end if;

  see_all := public.is_admin();

  return query
    with series as (
      select generate_series(
               (now() at time zone tz)::date - (span - 1),
               (now() at time zone tz)::date,
               interval '1 day'
             )::date as d
    )
    select s.d,
           count(e.id),
           count(distinct e.user_id)
    from series s
    left join public.auth_events e
      on e.kind = 'signed_in'
     and (e.created_at at time zone tz)::date = s.d
     and (see_all or e.user_id = (select auth.uid()))
    group by s.d
    order by s.d;
end;
$$;


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on function public.is_active_member()                                from public, anon;
revoke execute on function public.set_member_status(uuid, public.member_status)     from public, anon;
revoke execute on function public.allowed_domain_list()                             from public, anon;
revoke execute on function public.admin_domains()                                   from public, anon;
revoke execute on function public.add_allowed_domain(text)                          from public, anon;
revoke execute on function public.remove_allowed_domain(text)                       from public, anon;
revoke execute on function public.sign_ins_by_day(integer, text)                    from public, anon;

grant execute on function public.is_active_member()                                 to authenticated;
grant execute on function public.set_member_status(uuid, public.member_status)      to authenticated;
grant execute on function public.allowed_domain_list()                              to authenticated;
grant execute on function public.admin_domains()                                    to authenticated;
grant execute on function public.add_allowed_domain(text)                           to authenticated;
grant execute on function public.remove_allowed_domain(text)                        to authenticated;
grant execute on function public.sign_ins_by_day(integer, text)                     to authenticated;
