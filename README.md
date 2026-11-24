# HB+ Team Space

A small app for the HB+ team that runs on Android, iOS and the web from one Expo codebase. You sign in with Google, and only `@hbplus.fit` accounts get in. Anyone else sees:

> Access restricted. Please login using your official domain email.

**Live demo:** `https://<your-site>.netlify.app`

Built with Expo SDK 58 and Expo Router, React Native for Web, Supabase (Auth and Postgres), Google OAuth 2.0 and TypeScript.

## What's in it

- A login page with a "Login with Google" button, a loading state and proper error messages
- A dashboard that only signed-in `@hbplus.fit` users can open, plus logout
- Admin and member roles, stored in the database
- An admin panel for managing members, allowed domains and the audit log (a bit beyond the brief, but it made the roles actually useful)
- The same code on web and mobile, with `.web.ts` files where the platforms need different behaviour

## Trying it out

- Sign in with an `@hbplus.fit` Google account and you land on the dashboard.
- Sign in with a personal Gmail account and you're sent back to the login page with the restriction message.
- Open `/dashboard` in a fresh browser without signing in and you're redirected to `/login`.
- New accounts start as members. The admin panel only appears for admins (see [Roles](#roles)).

## Setup instructions

You'll need Node 22 or newer, a Supabase project (the free tier is fine) and a Google Cloud project. For mobile, use an Android emulator, the iOS Simulator, or Expo Go on your phone.

### 1. Google Cloud

1. Go to **APIs & Services → OAuth consent screen**. Set the user type to **External**, add the `openid`, `email` and `profile` scopes, and publish the app.

   Keep it on External. With Internal, Google blocks Gmail accounts on its own screen, so the app never gets the chance to show the restriction message the brief asks for.
2. Go to **Credentials → Create credentials → OAuth client ID** and pick **Web application**.
3. Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorised redirect URI.

### 2. Supabase

1. In **Authentication → Providers → Google**, turn Google on and paste in the client ID and secret.
2. In **Authentication → URL Configuration**:
   - Site URL: your Netlify URL, or `http://localhost:8081` while developing
   - Redirect URLs:
     ```
     http://localhost:8081/**
     https://<your-site>.netlify.app/**
     hbplusaccess://**
     exp://**
     ```
3. In the **SQL Editor**, run the three files from [`supabase/migrations/`](supabase/migrations) in this order, each in a new query:
   1. `20261123120000_domain_restricted_auth.sql`: allowed domains, profiles and roles
   2. `20261123130000_activity_log.sql`: the activity log and the dashboard numbers
   3. `20261124090000_admin_panel.sql`: suspending members, managing domains, chart data

   If you use the Supabase CLI, `supabase db push` does the same.
4. In **Authentication → Hooks → Before User Created**, choose Postgres and select `public.hook_before_user_created`.

   This step is optional. Without it, the database trigger still blocks other domains. Supabase then shows a generic "Database error saving new user" instead of the proper message, and the app translates that back into the restriction message.
5. After you've signed in once, make yourself an admin:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@hbplus.fit';
   ```

### 3. Run the app

```bash
npm install
cp .env.example .env    # then add your Supabase URL and publishable (anon) key

npm run web             # http://localhost:8081
npm run android         # Android emulator
npm run ios             # iOS Simulator, macOS only
```

You can also run `npx expo start` and scan the QR code with Expo Go.

Only the publishable (anon) key belongs in `.env`. Anything starting with `EXPO_PUBLIC_` gets bundled into the app, so the service_role key must never go there.

## Authentication flow

1. The user taps **Login with Google**. The app calls Supabase's `signInWithOAuth` using PKCE, so only a code challenge leaves the device.
2. Supabase sends them to Google. I pass `prompt=select_account`, so the account picker always shows and switching accounts is easy.
3. Google sends the chosen account back to Supabase. For a new user, Supabase first calls the before-user-created hook, and a trigger on `auth.users` checks the domain again. A wrong domain stops right here and no account is created.
4. Supabase redirects back to the app with a one-time `?code=`, or with `?error_description=` if it refused the account.
   - **Web:** a normal full-page redirect back to `/login`. supabase-js picks up the code by itself.
   - **Mobile:** `expo-web-browser` opens an auth session and waits for the `hbplusaccess://login` deep link. The app then exchanges the code itself, and the PKCE verifier never leaves the phone.
5. The code and the PKCE verifier are swapped for a session.
6. Before showing anything, `admit()` in [`auth-provider.tsx`](src/features/auth/auth-provider.tsx) checks four things:
   - `getUser()` asks the auth server who the token really belongs to. `getSession()` only reads local storage, so I don't rely on it for this.
   - The email's domain has to be on the allowed list.
   - The user's profile row has to be readable. Row Level Security only allows that for allowed domains, and the row is also where the role comes from.
   - The account must not be suspended.

   If any check fails, the app signs the user out, revokes the refresh token and shows the error.
7. After that, a lighter check re-reads the profile when the token refreshes or the user comes back to the app (at most every 30 seconds). A suspension or role change therefore applies without logging in again.

## How the domain restriction works

The check in the app is only there so the user gets a quick, clear message. Anything that runs in a browser can be bypassed, so the real enforcement happens in the database.

| Where | What happens |
|---|---|
| App, [`src/lib/domain.ts`](src/lib/domain.ts) | `isAllowedEmail()` checks the user returned by `getUser()` against the allowed list and signs them out if it doesn't match. |
| Auth hook, `hook_before_user_created` | Supabase calls it before creating any user. Other domains get a 403 with the restriction message, so the account is never created. |
| Trigger, `handle_new_user` on `auth.users` | A second stop. It raises an error for other domains even if the hook isn't switched on. |
| Row Level Security on `profiles` | The policies check the email inside the JWT, so even if someone somehow had a session, they would read nothing. |

All four read the same `public.allowed_domains` table, so they can't drift apart. Admins can change that list from the admin panel. `EXPO_PUBLIC_ALLOWED_DOMAIN` only sets the domain shown on the login screen, and acts as a fallback if the list can't be loaded.

The match is exact. I take everything after the last `@`, lowercase it, and compare it with the allowed domain. A simple `endsWith('hbplus.fit')` would let `x@nothbplus.fit` through. The tests on both the TypeScript and SQL side cover these cases:

- `x@nothbplus.fit` is rejected
- `x@mail.hbplus.fit` is rejected
- `hbplus.fit@gmail.com` is rejected
- `"x@hbplus.fit"@gmail.com` is rejected
- `Example@HBPlus.fit` is allowed

I didn't add Google's `hd=hbplus.fit` parameter to the login URL. It's only a hint for the account picker, anyone can delete it from the URL, and it would stop Gmail users from ever seeing the error message the brief asks for.

## Roles

- The role (`user` or `admin`) lives in `public.profiles.role`, not in `user_metadata`. Users can edit their own metadata, so a role stored there could be self-granted.
- The app can't insert, update or delete profiles directly. Roles only change through `set_member_role()`, which checks that the caller is an admin. It also won't let admins change their own role, so there's always at least one admin left.
- Members can only read their own profile. Admins can read everyone's.
- Sign-ins, role changes, suspensions and domain changes are written to `public.auth_events` by the database itself. The app can read this log but can't write to it, so entries can't be faked or deleted, even by admins.
- The dashboard's "Who's around" card shows the names and photos of the six people who signed in most recently, without emails. That's the one place members see anyone else, and it's done on purpose.

## Admin panel

Admins get `/admin` with four tabs:

- **Overview:** headline numbers, a sign-ins chart for 7, 14 or 30 days, and recent admin actions
- **Members:** search, make or remove admins, suspend or restore access
- **Access rules:** add or remove allowed email domains
- **Audit log:** every event, newest first, with filters

Each action is a Postgres function that checks the caller again, so the UI can't be used to get around the rules. A few guard rails:

- You can't suspend yourself or change your own role.
- You can't remove the domain your own account uses.
- Public email providers like gmail.com can't be added from the panel. If someone really wants that, it has to be done on purpose in SQL.

A suspended member is blocked in the database straight away. Their app notices on its next check and signs them out with an explanation.

## Protected routes

Routing uses Expo Router's `Stack.Protected` in [`src/app/_layout.tsx`](src/app/_layout.tsx):

```tsx
<Stack.Protected guard={!signedIn}>
  <Stack.Screen name="login" />
</Stack.Protected>
<Stack.Protected guard={signedIn} redirectTo="/login">
  <Stack.Screen name="(app)" />   {/* /dashboard and /admin */}
</Stack.Protected>
```

- Going to `/dashboard` while signed out sends you to `/login`. Going to `/admin` as a member sends you to `/dashboard`.
- The router waits until the saved session has loaded, so refreshing a protected page doesn't bounce you through the login screen.
- After you log out, the Back button can't take you to the dashboard again.
- Netlify serves `index.html` for every path, so direct links reach these guards instead of a 404.

These guards only decide what the screen shows. The data itself is protected by Row Level Security, so skipping the UI gets you nothing.

## Tokens

- PKCE on every platform, so tokens never appear in a URL.
- On mobile the session is stored in the iOS Keychain or Android Keystore through `expo-secure-store`. SecureStore can reject values over about 2 KB, so [`auth-storage.ts`](src/lib/auth-storage.ts) splits the session into chunks.
- On the web the session sits in `localStorage`, which is the supabase-js default. That's the usual trade-off for a static site. Cookies set by a server would be safer (see the last section).
- Tokens refresh automatically. Logout clears the device first and then revokes the refresh token on the server, so it still works when you're offline.

## Project structure

```
src/
  app/           routes: login, (app)/dashboard, (app)/admin
  features/      auth, dashboard, admin, activity, charts, shell (sidebar and phone menu)
  components/    UI pieces shared between screens
  hooks/  lib/  theme/  types/
supabase/
  migrations/    tables, Row Level Security, the hook, the trigger, admin functions
  tests/         access-rule checks against an in-memory Postgres
```

Where the web and mobile versions need different code, there's a `.web.ts` file next to the normal one (`google-sign-in.web.ts`, `auth-storage.web.ts`) instead of `Platform.OS` checks scattered around.

## Tests

```bash
npm test          # Jest: domain matching, URL parsing, error messages
npm run test:db   # runs every migration on PGlite and checks 70 access rules
npm run typecheck
npm run lint
```

`test:db` creates users through the trigger and calls the hook the way Supabase does. It then acts as an anonymous visitor, a member, an admin, a suspended member, and a token with a Gmail address, and checks what each one can see or change.

## Deploying to Netlify

[`netlify.toml`](netlify.toml) already has the build command, the redirect that makes direct links work, and a few security headers.

1. In Netlify, choose **Add new site → Import an existing project** and pick this repository.
2. Under **Environment variables**, add `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` and `EXPO_PUBLIC_ALLOWED_DOMAIN`.
3. Deploy, then add the site's URL to Supabase's Site URL and Redirect URLs.

## What I'd improve next

- **Check Google's `hd` claim in the hook.** Right now the check is on the email address, and someone can register a personal Google account with a work email. Google only includes `hd` for accounts the Workspace actually manages.
- **Put the role in the JWT** with a custom access token hook, which saves a database query when the app starts.
- **Move web sessions to httpOnly cookies** and add a Content-Security-Policy.
- **Block suspended users in Supabase Auth itself.** That needs the service-role key, so it would live in an Edge Function, never in the app.
- **End-to-end tests**, with Playwright for the web and Maestro for mobile.
