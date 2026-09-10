# Field Service Platform — Manual Deployment Guide

This is the standalone how-to for getting this repository live: a Supabase project with the
core schema applied, and a Vercel project deployed from GitHub with the right environment
variables. Everything here is done manually in each service's own dashboard — no automated
Claude/MCP setup is used, by request.

The three services and how they relate:

| Service | Holds | Updates when |
|---|---|---|
| **GitHub** | Source code (this repo) | Every `git push` |
| **Vercel** | Build/deploy of the code from GitHub | Automatically on every push to the branch Vercel is watching (Project Settings → Git → Production Branch) |
| **Supabase** | Database schema + data | **Never automatically from a push.** Migration SQL must be run manually in the Supabase SQL Editor |

Pushing code to GitHub does **not** touch the database, and creating/updating the database does
**not** touch Vercel. Each step below is separate and must be done in order.

---

## 1. Supabase — create the project and apply the schema

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**.
   - Name: anything (e.g. `field-service-platform`).
   - Region: closer to your users = lower latency (e.g. Singapore/`ap-southeast-1` for Indonesia).
   - Set a database password and save it somewhere — not otherwise needed for this app, but
     Supabase requires it.
2. Wait for the project to finish provisioning (a minute or two).
3. Open **SQL Editor → New query**. Run these files from `supabase/migrations/` in this repo,
   **one at a time, in this exact numeric order** (each one depends on tables/functions created
   by the ones before it):
   1. `supabase/migrations/001_core_schema.sql` — tables: `users`, `user_credentials`,
      `user_sessions`, `login_attempts`, `password_reset_otps`, `audit_trail`,
      `notifications`, `app_settings`, `rahasia_integrasi`.
   2. `supabase/migrations/002_core_functions.sql` — RLS helper functions
      (`jwt_claim`/`jwt_user_id`/`lingkup_semua`/etc.) and the trigger that freezes
      privileged `users` columns against direct client edits.
   3. `supabase/migrations/003_core_rls.sql` — enables Row Level Security and creates the
      policies for the tables above.
   4. `supabase/migrations/004_field_service_schema.sql` — the 12 Field Service (`fs_*`) tables:
      `fs_projects`, `fs_areas`, `fs_locations`, `fs_execution_points`, `fs_pic_assignments`,
      `fs_recurring_schedules`, `fs_execution_instances`, `fs_work_sessions`, `fs_gps_events`,
      `fs_evidence`, `fs_reviews`, `fs_project_settings`.
   5. `supabase/migrations/005_field_service_functions.sql` — Field Service enforcement
      functions, including the `SECURITY DEFINER` functions `fs_check_in`/`fs_check_out`/
      `fs_status_transition` that PIC check-in/check-out and status changes go through.
   6. `supabase/migrations/006_field_service_rls.sql` — enables Row Level Security and creates
      the policies for all `fs_*` tables above (must run after 005, since these policies call
      its functions).
   - Paste the whole file content into one query and click **Run** each time. All six should
     complete with no errors.
4. Optional but recommended: **Advisors → Security** in the Supabase dashboard should show only
   informational "RLS enabled, no policy" notices for `user_credentials`, `user_sessions`,
   `login_attempts`, `password_reset_otps`, `rahasia_integrasi` — that's intentional (see the
   comment at the bottom of `003_core_rls.sql`), not a problem to fix. Under **Advisors →
   Performance** you may also see a warning that `fs_check_in`, `fs_check_out`,
   `fs_status_transition`, `fs_is_assigned`, `fs_effective_gps_radius`, and
   `fs_effective_evidence_min_count` are `SECURITY DEFINER` functions callable by `anon`/
   `authenticated` — that's also intentional and explained in the header comment of
   `006_field_service_rls.sql`.
5. Create your first admin account (the `users` table starts empty, and the app can't create an
   admin from the UI since registration always creates a `guest`/pending account). In **SQL
   Editor**, run (replace the bracketed values):

   ```sql
   -- 1) Create the user row directly as admin (bypasses the client-side guard trigger
   --    because this runs as the Postgres owner, not as anon/authenticated).
   insert into public.users (username, full_name, role, access_level, team_type)
   values ('admin@example.com', 'Nama Anda', 'admin', 'full', 'Internal')
   returning id;
   ```

   Copy the returned `id`, then set its password (bcrypt hash — generate one at
   <https://bcrypt-generator.com/> with 10-12 rounds, or run `node -e "console.log(require('bcryptjs').hashSync('YourPassword123', 10))"`
   locally if you have Node + `bcryptjs` installed):

   ```sql
   insert into public.user_credentials (user_id, password_hash)
   values ('<the id from above>', '<the bcrypt hash>');
   ```

   You can now log in with `admin@example.com` / the password you hashed, once the app is
   deployed (step 3 below).
6. Collect these four values from **Settings → API** (you'll need them for Vercel):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **API Keys → anon / public** (legacy JWT-based key) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **API Keys → service_role** (secret — never expose this to the browser) →
     `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Settings → Legacy JWT Secret** → `SUPABASE_JWT_SECRET`

---

## 2. GitHub — make sure the code is there

This repo already has everything pushed to branch `claude/field-service-transformation-6qq2js`
on `dhanywp20-cmyk/WorkManagement-Kim`. Nothing to do here unless you want it on `main` instead —
if so, merge that branch into `main` yourself (or ask for a PR) before the Vercel step.

---

## 3. Vercel — import the repo and deploy

1. In your Vercel account, **Add New... → Project**.
2. Select `dhanywp20-cmyk/WorkManagement-Kim`. If it's not listed, click **Adjust GitHub App
   Permissions** on that screen → in GitHub, find the **Vercel** app under
   Settings → Applications → Installed GitHub Apps → **Configure** → add this repository →
   **Save** → go back to Vercel, it will now appear.
3. Before or right after import, set **Project Settings → Git → Production Branch** to
   `claude/field-service-transformation-6qq2js` (not `main` — `main` does not have the trimmed
   Field Service codebase or the matching database schema).
4. In **Project Settings → Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase step 1.6 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase step 1.6 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase step 1.6 |
   | `SUPABASE_JWT_SECRET` | from Supabase step 1.6 |
   | `CRON_SECRET` | any random string you make up (no cron jobs run yet, but the app checks for this var existing) |

5. Deploy (or redeploy, if the first build already ran against `main` before you changed the
   branch).
6. Once live, open `https://<your-app>.vercel.app/api/auth/db-token-check` after logging in as
   the admin account from step 1.5 — this endpoint (admin-only) verifies
   `SUPABASE_JWT_SECRET` is wired correctly end-to-end (it issues a token and checks that
   PostgREST actually accepts its signature). `siap: true` in the response means the auth/RLS
   pipeline is fully connected.

---

## 4. What "live" gets you right now

At this point you have: login, session management, the Admin Panel's user management, generic
notifications, and an otherwise empty dashboard shell — the clean base described in
`docs/field-service-audit.md` and `docs/field-service-architecture.md`. The actual Field Service
features (Location Master, PIC Assignment, GPS check-in, evidence, client review, etc.) are a
separate, larger schema (`fs_*` tables) and set of pages, tracked as the next phase in
`docs/field-service-architecture.md` §17.

## 5. Common issues

- **Login fails with no error / redirects to `/dashboard` immediately**: check
  `middleware.ts` — it only allows unauthenticated access to a fixed list of paths; if you're
  hitting something else, that's expected (not a bug).
- **"supabaseUrl is required" at build time**: an env var is missing. All five in step 3.4 must
  be set for the same environment (Production/Preview/Development) you're building for.
- **RLS silently returns empty results**: usually means `SUPABASE_JWT_SECRET` doesn't match
  between what's in Vercel and what Supabase actually has — re-check step 1.6/3.4 match exactly,
  then use the `/api/auth/db-token-check` endpoint from step 3.6 to confirm.
