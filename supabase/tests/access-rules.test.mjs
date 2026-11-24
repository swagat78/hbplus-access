import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Runs every migration against an in-memory Postgres (PGlite) with small
// stand-ins for Supabase's auth schema, then checks the access rules.
// npm run test:db

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const migrations = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const db = new PGlite();

// Minimal stand-ins for what Supabase provides.
await db.exec(`
  create role anon; create role authenticated; create role supabase_auth_admin;
  create schema auth;
  grant usage on schema auth to anon, authenticated, supabase_auth_admin;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb,
    last_sign_in_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant execute on function auth.uid(), auth.jwt() to anon, authenticated, supabase_auth_admin;
  grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon, authenticated;
  alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
`);

for (const file of migrations) {
  await db.exec(fs.readFileSync(path.join(dir, file), 'utf8'));
}
await db.exec(`grant select, insert, update, delete on public.profiles to anon, authenticated;
  revoke insert, update, delete on public.profiles from anon, authenticated;`);

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`);
};
const attempt = async (sql, params) => {
  try { return { rows: (await db.query(sql, params)).rows }; } catch (e) { return { error: e.message }; }
};
const as = async (user) => {
  await db.exec('reset role');
  if (!user) return;
  await db.exec(`set request.jwt.claim.sub = '${user.id}'; set request.jwt.claims = '${JSON.stringify({ sub: user.id, email: user.email })}'; set role authenticated;`);
};

// --- trigger ---
const insertUser = (email) =>
  attempt(`insert into auth.users (email, raw_user_meta_data, last_sign_in_at) values ($1, '{"full_name":"Test"}', now()) returning id, email`, [email]);

let r = await insertUser('admin@hbplus.fit');
check('trigger allows @hbplus.fit', !r.error, r.error);
const admin = r.rows[0];
r = await insertUser('Coach@HBPLUS.fit');
check('trigger allows mixed-case domain', !r.error, r.error);
const coach = r.rows[0];
for (const bad of ['someone@gmail.com', 'x@nothbplus.fit', 'x@mail.hbplus.fit', 'hbplus.fit@gmail.com', '@hbplus.fit']) {
  r = await insertUser(bad);
  check(`trigger blocks ${bad}`, !!r.error && /official domain/.test(r.error), r.error ?? 'inserted!');
}
r = await attempt('select count(*)::int n from public.profiles');
check('only allowed users got profiles', r.rows[0].n === 2, String(r.rows[0].n));
r = await attempt(`select email from public.profiles where id = $1`, [coach.id]);
check('profile email stored lowercase', r.rows[0].email === 'coach@hbplus.fit', r.rows[0].email);

// --- hook ---
await db.exec('set role supabase_auth_admin');
r = await attempt(`select public.hook_before_user_created('{"user":{"email":"a@hbplus.fit"}}') v`);
check('hook allows hbplus.fit (runs as supabase_auth_admin)', JSON.stringify(r.rows?.[0]?.v) === '{}', r.error ?? JSON.stringify(r.rows[0].v));
r = await attempt(`select public.hook_before_user_created('{"user":{"email":"a@gmail.com"}}') v`);
check('hook rejects gmail with 403 + message', r.rows?.[0]?.v?.error?.http_code === 403 && /official domain/.test(r.rows[0].v.error.message), r.error ?? JSON.stringify(r.rows[0].v));
await db.exec('reset role');

// --- sign-in sync trigger ---
await db.exec(`update auth.users set last_sign_in_at = now() + interval '1 hour', raw_user_meta_data = '{"full_name":"Coach Renamed"}' where id = '${coach.id}'`);
r = await attempt(`select full_name from public.profiles where id = $1`, [coach.id]);
check('sign-in trigger syncs name', r.rows[0].full_name === 'Coach Renamed', r.rows[0].full_name);

// --- RLS ---
await db.exec(`update public.profiles set role = 'admin' where id = '${admin.id}'`);

await as(coach);
r = await attempt('select id from public.profiles');
check('member only sees own profile', r.rows?.length === 1 && r.rows[0].id === coach.id, r.error ?? `${r.rows.length} rows`);

await as(admin);
r = await attempt('select id from public.profiles');
check('admin sees every profile', r.rows?.length === 2, r.error ?? `${r.rows.length} rows`);

await as({ id: coach.id, email: 'coach@gmail.com' });
r = await attempt('select id from public.profiles');
check('token with non-allowed email sees nothing', r.rows?.length === 0, r.error ?? `${r.rows.length} rows`);

await as(coach);
r = await attempt(`update public.profiles set role = 'admin' where id = $1`, [coach.id]);
check('member cannot self-promote via UPDATE', !!r.error, r.error ?? 'updated!');
r = await attempt(`insert into public.profiles (id, email) values (gen_random_uuid(), 'x@hbplus.fit')`);
check('member cannot INSERT profiles', !!r.error, r.error ?? 'inserted!');
r = await attempt(`select public.set_member_role($1, 'admin')`, [coach.id]);
check('member cannot call set_member_role', /Only admins/.test(r.error ?? ''), r.error ?? 'allowed!');
r = await attempt(`select * from public.allowed_domains`);
check('allowed_domains hidden from clients', !!r.error || r.rows.length === 0, r.error ?? `${r.rows.length} rows`);

await as(admin);
r = await attempt(`select public.set_member_role($1, 'admin')`, [coach.id]);
check('admin can promote a member', !r.error, r.error);
r = await attempt(`select public.set_member_role($1, 'user')`, [admin.id]);
check('admin cannot change own role', /own role/.test(r.error ?? ''), r.error ?? 'allowed!');
r = await attempt(`select public.set_member_role(gen_random_uuid(), 'user')`);
check('unknown member id errors', /no longer exists/.test(r.error ?? ''), r.error ?? 'allowed!');

await db.exec('reset role; set role anon');
r = await attempt('select id from public.profiles');
check('anon sees nothing', !!r.error || r.rows.length === 0, r.error ?? `${r.rows.length} rows`);
r = await attempt(`select public.is_allowed_email('a@hbplus.fit')`);
check('anon cannot call is_allowed_email', !!r.error, r.error ?? 'allowed!');
r = await attempt(`select public.team_overview()`);
check('anon cannot call team_overview', !!r.error, r.error ?? 'allowed!');

// --- activity log ---
await as(admin);
r = await attempt(`select public.set_member_role($1, 'admin')`, [coach.id]);
check('setting the same role again is a no-op', !r.error, r.error);

r = await attempt(`select user_id, actor_id, kind, detail from public.auth_events order by id`);
const kinds = r.rows?.map((e) => e.kind).join(',');
check('admin sees all activity (2 first sign-ins, 1 later sign-in, 1 role change)',
  kinds === 'signed_in,signed_in,signed_in,role_changed', r.error ?? kinds);
const change = r.rows?.find((e) => e.kind === 'role_changed');
check('role change records actor and from/to',
  change?.actor_id === admin.id && change?.user_id === coach.id && change?.detail.from === 'user' && change?.detail.to === 'admin',
  JSON.stringify(change));

r = await attempt(`select public.team_overview() v`);
const ov = r.rows?.[0]?.v;
check('team_overview counts the team',
  ov?.members === 2 && ov?.admins === 2 && ov?.active_week === 2 && ov?.suspended === 0 && ov?.domains === 1,
  r.error ?? JSON.stringify(ov));
check('team_overview directory has names and photos but no emails',
  ov?.recent?.length === 2 && ov.recent.every((p) => p.name && !('email' in p)),
  JSON.stringify(ov?.recent));

await as(null);
await db.exec(`update public.profiles set role = 'user' where id = '${coach.id}'`);
await as(coach);
r = await attempt(`select user_id from public.auth_events`);
check('member only sees their own activity', r.rows?.length === 3 && r.rows.every((e) => e.user_id === coach.id),
  r.error ?? `${r.rows.length} rows`);
r = await attempt(`insert into public.auth_events (user_id, kind) values ($1, 'signed_in')`, [coach.id]);
check('member cannot forge activity', !!r.error, r.error ?? 'inserted!');
r = await attempt(`select public.team_overview() v`);
check('member can read team counts', r.rows?.[0]?.v?.members === 2, r.error);

await as({ id: coach.id, email: 'coach@gmail.com' });
r = await attempt(`select public.team_overview()`);
check('team_overview refuses a non-allowed token', !!r.error, r.error ?? 'allowed!');
r = await attempt(`select id from public.auth_events`);
check('non-allowed token reads no activity', r.rows?.length === 0, r.error ?? `${r.rows.length} rows`);

// --- sign-in chart data ---
await as(admin);
r = await attempt(`select bucket, sign_ins, people from public.sign_ins_by_day(14, 'Asia/Kolkata')`);
check('sign_ins_by_day returns one row per day', r.rows?.length === 14, r.error ?? `${r.rows.length} rows`);
const today = r.rows?.[13];
check('admin chart counts the whole team today', Number(today?.sign_ins) === 3 && Number(today?.people) === 2,
  r.error ?? JSON.stringify(today));
await as(coach);
r = await attempt(`select sum(sign_ins)::int n from public.sign_ins_by_day(14, 'UTC')`);
check('member chart only counts their own sign-ins', r.rows?.[0]?.n === 2, r.error ?? JSON.stringify(r.rows[0]));
r = await attempt(`select count(*)::int n from public.sign_ins_by_day(500, 'UTC')`);
check('chart range is capped at 90 days', r.rows?.[0]?.n === 90, r.error ?? JSON.stringify(r.rows[0]));

// --- suspend / restore ---
await as(coach);
r = await attempt(`select public.set_member_status($1, 'suspended')`, [admin.id]);
check('member cannot suspend anyone', /Only admins/.test(r.error ?? ''), r.error ?? 'allowed!');

await as(admin);
r = await attempt(`select public.set_member_status($1, 'suspended')`, [admin.id]);
check('admin cannot suspend themselves', /own access/.test(r.error ?? ''), r.error ?? 'allowed!');
r = await attempt(`select public.set_member_status($1, 'suspended')`, [coach.id]);
check('admin can suspend a member', !r.error, r.error);
r = await attempt(`select detail from public.auth_events where kind = 'status_changed'`);
check('suspension is logged', r.rows?.[0]?.detail?.to === 'suspended', r.error ?? JSON.stringify(r.rows));

await as(coach);
r = await attempt(`select status from public.profiles where id = $1`, [coach.id]);
check('suspended member can still read their own status', r.rows?.[0]?.status === 'suspended', r.error ?? JSON.stringify(r.rows));
r = await attempt(`select id from public.auth_events`);
check('suspended member reads no activity', r.rows?.length === 0, r.error ?? `${r.rows.length} rows`);
r = await attempt(`select public.team_overview()`);
check('suspended member cannot read team numbers', !!r.error, r.error ?? 'allowed!');
r = await attempt(`select * from public.sign_ins_by_day()`);
check('suspended member cannot read chart data', !!r.error, r.error ?? 'allowed!');

// A suspended admin keeps the role on paper but loses the powers.
await as(null);
await db.exec(`update public.profiles set role = 'admin' where id = '${coach.id}'`);
await as(coach);
r = await attempt(`select id from public.profiles`);
check('suspended admin cannot read other profiles', r.rows?.length === 1, r.error ?? `${r.rows.length} rows`);
r = await attempt(`select public.set_member_role($1, 'user')`, [admin.id]);
check('suspended admin cannot change roles', /Only admins/.test(r.error ?? ''), r.error ?? 'allowed!');
await as(null);
await db.exec(`update public.profiles set role = 'user' where id = '${coach.id}'`);

await as(admin);
r = await attempt(`select public.set_member_status($1, 'active')`, [coach.id]);
check('admin can restore a member', !r.error, r.error);
await as(coach);
r = await attempt(`select public.team_overview() v`);
check('restored member is back in', r.rows?.[0]?.v?.members === 2, r.error);

// --- allowed domains ---
await as(coach);
r = await attempt(`select public.allowed_domain_list() v`);
check('any signed-in member can read the domain list', JSON.stringify(r.rows?.[0]?.v) === '["hbplus.fit"]', r.error ?? JSON.stringify(r.rows[0]));
r = await attempt(`select public.add_allowed_domain('hop.studio')`);
check('member cannot add a domain', /Only admins/.test(r.error ?? ''), r.error ?? 'allowed!');
r = await attempt(`select * from public.admin_domains()`);
check('member cannot list domain details', /Only admins/.test(r.error ?? ''), r.error ?? 'allowed!');

await as({ id: coach.id, email: 'coach@gmail.com' });
r = await attempt(`select public.allowed_domain_list() v`);
check('a rejected Gmail session can still read the list (so the app can explain why)', !r.error, r.error);

await as(admin);
r = await attempt(`select public.add_allowed_domain('  @Hop.Studio ')`);
check('admin can add a domain (normalised)', !r.error, r.error);
r = await attempt(`select domain, members from public.admin_domains()`);
check('admin_domains lists domains with member counts',
  r.rows?.map((d) => `${d.domain}:${d.members}`).join(',') === 'hbplus.fit:2,hop.studio:0', r.error ?? JSON.stringify(r.rows));
r = await attempt(`select actor_id, user_id, detail from public.auth_events where kind = 'domain_added'`);
check('domain change is logged without a subject member',
  r.rows?.[0]?.actor_id === admin.id && r.rows[0].user_id === null && r.rows[0].detail.domain === 'hop.studio',
  r.error ?? JSON.stringify(r.rows));
for (const [bad, why] of [['hop.studio', /already on the list/], ['not a domain', /look like a domain/], ['gmail.com', /public email provider/], ['localhost', /look like a domain/]]) {
  r = await attempt(`select public.add_allowed_domain($1)`, [bad]);
  check(`add_allowed_domain rejects "${bad}"`, why.test(r.error ?? ''), r.error ?? 'allowed!');
}
r = await attempt(`select public.remove_allowed_domain('hbplus.fit')`);
check('admin cannot remove their own domain', /own account uses it/.test(r.error ?? ''), r.error ?? 'allowed!');
r = await attempt(`select public.remove_allowed_domain('nope.example')`);
check('removing an unknown domain errors', /isn't on the list/.test(r.error ?? ''), r.error ?? 'allowed!');
r = await attempt(`select public.remove_allowed_domain('hop.studio')`);
check('admin can remove another domain', !r.error, r.error);
r = await attempt(`select public.allowed_domain_list() v`);
check('domain list is back to one', JSON.stringify(r.rows?.[0]?.v) === '["hbplus.fit"]', r.error ?? JSON.stringify(r.rows[0]));

await db.exec('reset role; set role anon');
for (const fn of ['allowed_domain_list()', 'sign_ins_by_day()', `set_member_status(gen_random_uuid(), 'active')`, `add_allowed_domain('x.com')`]) {
  r = await attempt(`select public.${fn}`);
  check(`anon cannot call ${fn.split('(')[0]}`, /permission denied/.test(r.error ?? ''), r.error ?? 'allowed!');
}
await db.exec('reset role');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
