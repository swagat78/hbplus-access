# HB+ Team Space

This is my take on the HB+ assignment: a React Native app (Expo, with React Native for Web in the browser) where you log in with Google and only `@hbplus.fit` accounts get through. Anyone else gets:

> Access restricted. Please login using your official domain email.

Live demo: https://hbplus-team-space.netlify.app

The same code runs on Android, iOS and the web. Supabase handles auth and the database.

## Trying it

Log in with an `@hbplus.fit` Google account and you end up on the dashboard. Log in with a personal Gmail account and you're sent back to the login page with the message above. If you open `/dashboard` without logging in, you get redirected to `/login`.

Everyone starts as a normal member. The admin panel only shows up for admins, and there's a one-line SQL command for that further down.

## Setup instructions

These steps are for running your own copy, so `<your-site>` and `<project-ref>` below mean your own Netlify site and Supabase project. (The demo above is `hbplus-team-space.netlify.app`.)

You'll need Node 22+, a Supabase project (the free tier is fine) and a Google Cloud project. For mobile, an Android emulator, the iOS Simulator or Expo Go on your phone all work.

**Google Cloud**

1. In APIs & Services → OAuth consent screen (called Google Auth Platform in the newer console), pick **External** and add the `openid`, `email` and `profile` scopes. Then publish the app so its status is **In production**. While it's still in Testing, only the test users you've listed can log in, and everyone else gets stopped on Google's screen. Don't pick Internal either: Google would block Gmail accounts itself, and the app would never get to show its own error message.
2. Create an OAuth client ID of type **Web application**.
3. Add `https://<project-ref>.supabase.co/auth/v1/callback` as a redirect URI.

**Supabase**

1. Authentication → Sign In / Providers → Google: switch it on and paste in the client ID and secret.
2. Authentication → URL Configuration: set the Site URL to your Netlify URL (or `http://localhost:8081` locally) and add these redirect URLs:
   ```
   http://localhost:8081/**
   https://<your-site>.netlify.app/**
   hbplusaccess://**
   exp://**
   ```
3. In the SQL Editor, run the files in `supabase/migrations/` in order, one query each:
   1. `20261123120000_domain_restricted_auth.sql`: allowed domains, profiles and roles
   2. `20261123130000_activity_log.sql`: activity log and dashboard numbers
   3. `20261124090000_admin_panel.sql`: suspending members, managing domains, chart data
   4. `20261124150000_member_insights.sql`: personal sign-in history, plus a backfill of older sign-ins

   If you use the Supabase CLI, `supabase db push` runs them all for you. If the dashboard tiles show a dash instead of numbers later on, one of these hasn't been run.
4. Authentication → Auth Hooks → Add hook → **Before User Created**, type Postgres, function `public.hook_before_user_created`. This one's optional. Without it the trigger still blocks other domains, Supabase just returns a vaguer error, which the app turns back into the right message.
5. Log in once, then make yourself an admin. Only someone with access to the project's SQL Editor can do this, which is the point:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@hbplus.fit';
   ```

**The app**

```bash
npm install
cp .env.example .env    # add your Supabase URL and publishable key
npm run web             # or npm run android / npm run ios
```

`npx expo start` with the Expo Go app works too. Only put the publishable (anon) key in `.env`. Everything starting with `EXPO_PUBLIC_` ends up in the bundle, so the service_role key never goes there.

## Authentication flow

Pressing **Login with Google** calls Supabase's `signInWithOAuth` with PKCE, which opens Google's account picker. I pass `prompt=select_account` so you can always switch accounts. Google sends the chosen account back to Supabase. For a new user, Supabase runs the before-user-created hook and then a trigger on `auth.users`, and both check the domain. A wrong domain stops right there, so the account never gets created.

Supabase then redirects back to the app with a one-time code, or with an error if it refused the account. On the web that's a normal redirect to `/login`, and supabase-js picks up the code. On mobile, `expo-web-browser` opens an auth session and waits for the `hbplusaccess://login` deep link, then the app swaps the code for a session itself.

Before the dashboard shows anything, `admit()` in `src/features/auth/auth-provider.tsx` runs a few checks:

1. `getUser()` asks the auth server who the token belongs to. I don't trust `getSession()` here, because it only reads local storage.
2. The email's domain has to be on the allowed list.
3. The user's profile has to be readable. RLS only allows that for allowed domains, and it's also where the role comes from.
4. The account can't be suspended.

If anything fails, the app signs you out and shows the error. After that it quietly re-reads the profile when the token refreshes or you come back to the tab, so a suspension or role change kicks in without logging in again.

## How the domain restriction works

The check in the app is only there to show a quick, clear message. Anything running in the browser can be bypassed, so I didn't want to rely on it. The database enforces the rule in three more places:

- The before-user-created hook rejects other domains with a 403 before the account even exists.
- The `handle_new_user` trigger on `auth.users` runs the same check again, in case the hook ever gets switched off.
- Row Level Security on `profiles` looks at the email inside the JWT, so a session with the wrong email can't read anything.

All of them, and the app, read the same `public.allowed_domains` table, so they can't disagree. Admins can edit that list from the admin panel. `EXPO_PUBLIC_ALLOWED_DOMAIN` is just the domain the login screen mentions, and a fallback if the list can't be loaded.

The match is exact. I take everything after the last `@`, lowercase it and compare. A plain `endsWith('hbplus.fit')` would have let `x@nothbplus.fit` in. The tests check that `x@nothbplus.fit`, `x@mail.hbplus.fit`, `hbplus.fit@gmail.com` and `"x@hbplus.fit"@gmail.com` are all rejected, and that `Example@HBPlus.fit` is allowed.

I left Google's `hd=hbplus.fit` parameter out on purpose. It's only a hint for the account picker, it's easy to delete from the URL, and it would stop Gmail users from ever seeing the error message the brief asks for.

## Roles and the admin panel

Roles (`user` or `admin`) are stored in `public.profiles`, not in `user_metadata`, because users can edit their own metadata. The app has no write access to `profiles` at all. Roles change through `set_member_role()`, which checks that the caller is an admin and doesn't let anyone change their own role.

Admins get `/admin` with an overview, a members list (make or remove admins, suspend or restore), the allowed domains and an audit log. Every action there is a Postgres function that checks the caller again. I also added a few rules so nobody can lock themselves out: you can't suspend yourself or change your own role, you can't remove your own domain, and public providers like gmail.com can't be added from the panel.

Sign-ins and changes are written to `public.auth_events` by the database, and the app can only read it. Members see their own events, admins see everyone's. The "Who's around" card on the dashboard is the one place members see other people: names and photos of the six most recent, no emails.

## Protected routes and tokens

- Routes are guarded with Expo Router's `Stack.Protected` in `src/app/_layout.tsx`. Opening `/dashboard` while logged out sends you to `/login`, `/admin` as a member sends you to `/dashboard`, and after logout the Back button can't get you back in.
- The router waits for the saved session before deciding anything, so refreshing a protected page doesn't bounce you to the login screen.
- Netlify serves `index.html` for every path, so direct links still go through these guards.
- PKCE everywhere, so tokens never show up in a URL. On mobile the session lives in the Keychain/Keystore via `expo-secure-store`, split into chunks because SecureStore can reject values over about 2 KB. On the web it's in `localStorage`, the supabase-js default for a static site.
- Logout clears the device first and then revokes the refresh token on the server.

The guards only decide what's on screen. The data itself is protected by RLS.

## Project structure

```
src/
  app/          routes: login, dashboard, admin
  features/     auth, dashboard, admin, activity, charts, shell
  components/   shared UI
  hooks/  lib/  theme/  types/
supabase/
  migrations/   schema, RLS, hook, trigger, functions
  tests/        access rules, run against an in-memory Postgres
```

Where web and mobile need different code there's a `.web.ts` file next to the normal one, like `google-sign-in.web.ts`.

## Tests

```bash
npm test          # domain matching, URL parsing, error messages, sign-in streaks
npm run test:db   # all migrations on PGlite + 77 access-rule checks
npm run typecheck
npm run lint
```

`test:db` creates users through the trigger and calls the hook the way Supabase does. Then it acts as an anonymous visitor, a member, an admin, a suspended member and a Gmail token, and checks what each one can see or change.

## Deploying

`netlify.toml` already has the build command, the redirect for direct links and a few security headers. Import the repo in Netlify, add `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` and `EXPO_PUBLIC_ALLOWED_DOMAIN` as environment variables, deploy, then add the site URL to Supabase's Site URL and redirect URLs.

## If I had more time

- Check Google's `hd` claim in the hook. Right now the check is on the email address, and in theory someone could have a personal Google account on a work email. `hd` is only set for accounts the Workspace actually manages.
- Keep web sessions in httpOnly cookies and add a Content-Security-Policy.
- Ban suspended users in Supabase Auth too. That needs the service-role key, so it would live in an Edge Function.
- Count app visits, not only sign-ins, for the streak and "active this week".
- End-to-end tests: Playwright for the web, Maestro for mobile.
