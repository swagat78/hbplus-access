-- Activity log + team overview for the dashboard.
--
-- Every real sign-in and every role change is written here by the
-- database itself (triggers / set_member_role), never by the client, so the
-- log can't be forged from the app.


create table public.auth_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  actor_id   uuid references public.profiles (id) on delete set null,
  kind       text not null check (kind in ('signed_in', 'role_changed')),
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index auth_events_created_at_idx on public.auth_events (created_at desc);
create index auth_events_user_id_created_at_idx on public.auth_events (user_id, created_at desc);
create index auth_events_actor_id_idx on public.auth_events (actor_id);

alter table public.auth_events enable row level security;

create policy "members can read their own activity"
  on public.auth_events
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.is_allowed_email((select auth.jwt() ->> 'email'))
  );

create policy "admins can read all activity"
  on public.auth_events
  for select
  to authenticated
  using (
    public.is_admin()
    and public.is_allowed_email((select auth.jwt() ->> 'email'))
  );

revoke insert, update, delete on public.auth_events from anon, authenticated;


-- ---------------------------------------------------------------------------
-- Log sign-ins. Supabase only moves last_sign_in_at on a real sign-in, not
-- on token refresh, so this records logins rather than background noise.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_allowed_email(new.email) then
    raise exception 'Access restricted. Please login using your official domain email.'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, last_sign_in_at)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.last_sign_in_at
  );

  if new.last_sign_in_at is not null then
    insert into public.auth_events (user_id, kind) values (new.id, 'signed_in');
  end if;

  return new;
end;
$$;

create or replace function public.handle_user_sign_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set last_sign_in_at = new.last_sign_in_at,
         full_name  = coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', full_name),
         avatar_url = coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', avatar_url)
   where id = new.id;

  if found and new.last_sign_in_at is not null then
    insert into public.auth_events (user_id, kind) values (new.id, 'signed_in');
  end if;

  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- Log role changes, with who made them.
-- ---------------------------------------------------------------------------

create or replace function public.set_member_role(member_id uuid, new_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_role public.app_role;
begin
  if not (public.is_admin() and public.is_allowed_email((select auth.jwt() ->> 'email'))) then
    raise exception 'Only admins can change roles.' using errcode = '42501';
  end if;

  if member_id = (select auth.uid()) then
    raise exception 'You can''t change your own role.' using errcode = '42501';
  end if;

  select role into old_role from public.profiles where id = member_id for update;
  if not found then
    raise exception 'That member no longer exists.' using errcode = 'P0002';
  end if;

  if old_role = new_role then
    return;
  end if;

  update public.profiles set role = new_role where id = member_id;

  insert into public.auth_events (user_id, actor_id, kind, detail)
  values (
    member_id,
    (select auth.uid()),
    'role_changed',
    jsonb_build_object('from', old_role, 'to', new_role)
  );
end;
$$;


-- ---------------------------------------------------------------------------
-- Headline numbers for the dashboard. Counts only, so members can see the
-- size of the team without being able to read anyone else's profile.
-- ---------------------------------------------------------------------------

create or replace function public.team_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_allowed_email((select auth.jwt() ->> 'email')) then
    raise exception 'Access restricted.' using errcode = '42501';
  end if;

  return (
    select jsonb_build_object(
      'members',     count(*),
      'admins',      count(*) filter (where role = 'admin'),
      'active_week', count(*) filter (where last_sign_in_at > now() - interval '7 days')
    )
    from public.profiles
  );
end;
$$;


revoke execute on function public.team_overview() from public, anon;
grant  execute on function public.team_overview() to authenticated;
