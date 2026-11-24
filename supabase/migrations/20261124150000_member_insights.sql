-- Personal sign-in history for the dashboard, and the sign-ins that happened
-- before the activity log existed.
--
-- Runs after 20261124090000_admin_panel.sql. Safe to run more than once.


-- ---------------------------------------------------------------------------
-- sign_ins_by_day gets an only_mine switch, so an admin can see their own
-- history as well as the team's. Members get their own numbers whatever they
-- pass: only_mine can narrow what a caller sees, never widen it.
-- ---------------------------------------------------------------------------

drop function if exists public.sign_ins_by_day(integer, text);

create or replace function public.sign_ins_by_day(
  days integer default 14,
  tz text default 'UTC',
  only_mine boolean default false
)
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

  see_all := public.is_admin() and not coalesce(only_mine, false);

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

revoke execute on function public.sign_ins_by_day(integer, text, boolean) from public, anon;
grant  execute on function public.sign_ins_by_day(integer, text, boolean) to authenticated;


-- ---------------------------------------------------------------------------
-- Backfill. Sign-ins made before the activity log existed were never
-- recorded, so a member's history would start on the day the log did.
--
-- Supabase Auth keeps its own audit trail of logins: copy in every login
-- from before the member's first recorded sign-in. The minute of margin
-- keeps the login that started the log from being counted twice (the two
-- timestamps come from different clocks). A second run finds nothing older
-- than what it copied the first time, so it adds nothing.
--
-- Where that trail isn't readable, fall back to the sign-ins the profile
-- itself proves, for members with none recorded at all: the first one (when
-- the account was created) and the latest.
--
-- Copied rows say where they came from in detail.source.
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('auth.audit_log_entries') is not null then
    insert into public.auth_events (user_id, kind, detail, created_at)
    select p.id, 'signed_in', '{"source": "auth_audit_log"}'::jsonb, a.created_at
    from auth.audit_log_entries a
    join public.profiles p on p.id::text = a.payload ->> 'actor_id'
    where a.payload ->> 'action' = 'login'
      and a.created_at is not null
      and a.created_at < coalesce(
        (select min(e.created_at) from public.auth_events e
          where e.user_id = p.id and e.kind = 'signed_in') - interval '1 minute',
        'infinity'::timestamptz
      );
  end if;
exception
  when insufficient_privilege then
    raise notice 'Skipped copying from auth.audit_log_entries: no read access.';
end;
$$;

insert into public.auth_events (user_id, kind, detail, created_at)
select p.id, 'signed_in', '{"source": "profile"}'::jsonb, t.at
from public.profiles p
cross join lateral (
  select p.last_sign_in_at as at
  where p.last_sign_in_at is not null
  union all
  -- Someone who has only signed in once has both stamps at the same moment.
  select p.created_at
  where p.last_sign_in_at is null
     or p.last_sign_in_at > p.created_at + interval '1 minute'
) t
where not exists (
  select 1 from public.auth_events e
  where e.user_id = p.id and e.kind = 'signed_in'
);
