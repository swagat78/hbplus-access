-- Domain-restricted auth for the HB+ team space.
--
-- The app checks the email domain too, but anything in a client bundle can
-- be bypassed. These are the checks that actually hold:
--
--   1. hook_before_user_created  - Supabase Auth hook, rejects the sign-up
--                                  with a readable message
--   2. handle_new_user trigger   - hard stop on auth.users, in case the hook
--                                  isn't enabled on the project
--   3. RLS on profiles           - no data for a session outside the domain,
--                                  even if an account slipped in earlier
--
-- Roles live in public.profiles (not user_metadata, which users can edit
-- themselves through supabase.auth.updateUser).


-- ---------------------------------------------------------------------------
-- Allowed domains
-- ---------------------------------------------------------------------------

create table public.allowed_domains (
  domain     text primary key check (domain = lower(domain) and position('@' in domain) = 0),
  created_at timestamptz not null default now()
);

-- RLS on with no policies: clients can't read or change the list.
alter table public.allowed_domains enable row level security;

insert into public.allowed_domains (domain) values ('hbplus.fit');


-- Exact match on the part after the last "@". Not LIKE '%hbplus.fit',
-- which would also accept "x@nothbplus.fit".
create or replace function public.is_allowed_email(email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.allowed_domains d
    where d.domain = lower(split_part(trim(email), '@', -1))
  )
  and position('@' in coalesce(email, '')) > 1;
$$;


-- ---------------------------------------------------------------------------
-- Profiles + roles
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('user', 'admin');

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text not null unique,
  full_name       text,
  avatar_url      text,
  role            public.app_role not null default 'user',
  created_at      timestamptz not null default now(),
  last_sign_in_at timestamptz
);

alter table public.profiles enable row level security;

-- security definer so policies on profiles can call it without recursing
-- into themselves.
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
  );
$$;

create policy "members can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    and public.is_allowed_email((select auth.jwt() ->> 'email'))
  );

create policy "admins can read every profile"
  on public.profiles
  for select
  to authenticated
  using (
    public.is_admin()
    and public.is_allowed_email((select auth.jwt() ->> 'email'))
  );

-- No insert / update / delete policies. Rows are created by the trigger
-- below and roles only change through set_member_role().
revoke insert, update, delete on public.profiles from anon, authenticated;


-- ---------------------------------------------------------------------------
-- auth.users triggers
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

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Keeps name / photo / last sign-in fresh without the client writing to
-- profiles.
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

  return new;
end;
$$;

create trigger on_auth_user_signed_in
  after update of last_sign_in_at on auth.users
  for each row
  when (old.last_sign_in_at is distinct from new.last_sign_in_at)
  execute function public.handle_user_sign_in();


-- ---------------------------------------------------------------------------
-- Auth hook: Before User Created
-- Enable in Dashboard -> Authentication -> Hooks -> "Before User Created"
-- -> Postgres -> public.hook_before_user_created
-- ---------------------------------------------------------------------------

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
as $$
begin
  if public.is_allowed_email(event -> 'user' ->> 'email') then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Access restricted. Please login using your official domain email.'
    )
  );
end;
$$;


-- ---------------------------------------------------------------------------
-- Role management (admins only)
-- ---------------------------------------------------------------------------

create or replace function public.set_member_role(member_id uuid, new_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.is_admin() and public.is_allowed_email((select auth.jwt() ->> 'email'))) then
    raise exception 'Only admins can change roles.' using errcode = '42501';
  end if;

  -- Stops an admin from demoting themselves, which also means there's
  -- always at least one admin left.
  if member_id = (select auth.uid()) then
    raise exception 'You can''t change your own role.' using errcode = '42501';
  end if;

  update public.profiles
     set role = new_role
   where id = member_id;

  if not found then
    raise exception 'That member no longer exists.' using errcode = 'P0002';
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- Grants. Postgres lets PUBLIC execute new functions by default, so every
-- function is locked down and then opened to exactly who needs it.
-- ---------------------------------------------------------------------------

revoke execute on function public.is_allowed_email(text)                    from public, anon;
revoke execute on function public.is_admin()                                from public, anon;
revoke execute on function public.set_member_role(uuid, public.app_role)    from public, anon;
revoke execute on function public.hook_before_user_created(jsonb)           from public, anon, authenticated;
revoke execute on function public.handle_new_user()                         from public, anon, authenticated;
revoke execute on function public.handle_user_sign_in()                     from public, anon, authenticated;

grant execute on function public.is_allowed_email(text)                     to authenticated, supabase_auth_admin;
grant execute on function public.is_admin()                                 to authenticated;
grant execute on function public.set_member_role(uuid, public.app_role)     to authenticated;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_before_user_created(jsonb)            to supabase_auth_admin;
