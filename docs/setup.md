# MoverOS — Local Setup

Get the app running end to end on your machine. The **only two things you must
have** are your **Anthropic API key** and a **Supabase project** — everything
else is optional until you build the feature that needs it (see
[Accounts & API keys](#accounts--api-keys) at the bottom).

Prerequisites: **Node ≥ 22**, **pnpm 10.x**, and this repo cloned.

---

## 1. Create a Supabase project

Supabase gives you Postgres **and** Auth in one account (free tier is plenty).

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Set a **database password** and **save it** — you need it for `DATABASE_URL`.
3. Wait for the project to finish provisioning (~2 min).

Then collect four values:

| Value | Where in Supabase |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → **Project API keys → `anon` `public`** |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → **Project API keys → `service_role` `secret`** |
| `DATABASE_URL` | Settings → Database → **Connection string → "Connection pooling" → URI** (Transaction mode, port **6543**). Replace `[YOUR-PASSWORD]` with the password from step 2. |

> Use the **pooled** connection string (port 6543), not the direct one — the
> Drizzle client runs with `prepare: false` specifically for the pooler.

**For local dev, disable email confirmation** so sign-up logs you in instantly:
Authentication → Providers → **Email** → turn **"Confirm email" off**. (Leave it
on in production; the sign-up form already handles the "check your inbox" case.)

---

## 2. Apply the schema + RLS

There are **three** SQL files and they must run **in this order**:

1. `packages/db/migrations/0000_small_crystal.sql` — tables, enums, indexes, FKs.
2. `packages/db/supabase/0001_auth_fk_rls.sql` — the `auth.users` FK + Row-Level
   Security policies (requires the tables from step 1).
3. `packages/db/supabase/0002_profile_trigger.sql` — auto-creates a
   `user_profiles` row on signup.

### Easiest path — Supabase SQL Editor (no local tooling)

In the Supabase dashboard → **SQL Editor → New query**, then for each file in
order: paste its full contents and click **Run**. Three pastes, done.

### Alternative — drizzle-kit for step 1

If you'd rather run the generated migration from the CLI (steps 2 and 3 still go
through the SQL Editor — they touch the `auth` schema and aren't in Drizzle's
migration journal):

```bash
# DATABASE_URL must be set in the environment for this command
DATABASE_URL="postgresql://…6543/postgres" pnpm --filter @moveros/db db:migrate
```

> `pnpm --filter @moveros/db db:generate` regenerates the SQL from the Drizzle
> schema after you change a table — you won't need it for first setup.

---

## 3. Fill `.env.local`

The app reads env from **`apps/web/.env.local`** (gitignored). Copy the template
and fill in the values from step 1:

```bash
cp .env.example apps/web/.env.local
```

The **five variables the code actually uses today**:

```bash
# Supabase (step 1)
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon public key>"
DATABASE_URL="postgresql://postgres.<ref>:<password>@…pooler.supabase.com:6543/postgres"

# Anthropic — required for the agents to run
ANTHROPIC_API_KEY="sk-ant-…"

# Nylas — OPTIONAL. Leave blank: the approval email send is SIMULATED until set.
NYLAS_API_KEY=""
```

`SUPABASE_SERVICE_ROLE_KEY` isn't read yet but is safe to fill in now. Everything
else in `.env.example` (Stripe, Twilio, Resend, Google, Sentry, …) is for
features not built yet — leave blank.

---

## 4. Install and run

```bash
pnpm install
pnpm dev          # Next.js on http://localhost:3000
```

In a **second terminal**, start the Inngest dev server so background agent jobs
fire (**no Inngest account needed** — the dev server is fully local):

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

- App: <http://localhost:3000>
- Inngest dashboard (watch agent runs): <http://localhost:8288>

---

## 5. Verify the whole flow

1. Open <http://localhost:3000> → **Sign in** → **Create an account**.
2. You land on **/dashboard** (empty). Click **Start your move** → complete the
   5-step **onboarding wizard** → **Create move**.
3. Creating a move emits a `move/created` event → the **timeline agent** (Opus)
   runs. Watch it in the **Inngest dashboard** (:8288).
4. Open the move from the dashboard → **/dashboard/moves/[id]** → the
   agent-generated **task timeline** appears. Use **Mark done** / **Skip**.
5. The **approval inbox** on the dashboard fills when an agent produces an
   approval item; **Approve** runs `dispatch-approved-action` (email send is
   simulated until Nylas is configured — you'll see a `[nylas] … simulating`
   log).

If tasks never appear, check that `ANTHROPIC_API_KEY` is set and the Inngest dev
server is running and connected (green in the :8288 dashboard).

---

## Accounts & API keys

What the code reads **today** vs. what each future feature will need.

### ✅ Already have
- **Anthropic** — `ANTHROPIC_API_KEY`. Powers the agents.

### 🔴 Required now — nothing runs without it
- **Supabase** — one account → `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Auth + the entire
  database.

### 🟡 Recommended soon
- **Inngest** — background agent jobs. **No account for local dev** (the dev
  server needs no keys). Create an account only for production deploys, which
  need `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`.
- **Nylas** — send/receive email on the user's behalf via an OAuth **grant**
  (`nylas_grant_id`). Free/sandbox tier. Needed only when you want **real** email
  send; the send is simulated without it. Vars: `NYLAS_API_KEY`,
  `NYLAS_CLIENT_ID`, `NYLAS_CLIENT_SECRET`.

### ⚪ Later — only when you build that feature
| Service | Account? | For | Notes |
|---|---|---|---|
| **Stripe** | Yes | One-time unlock + gifting (payments) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| **Twilio** | Yes — **start early** | SMS notifications | Needs **A2P 10DLC** carrier registration (days–weeks). `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **Resend** | Yes | Transactional email from *your* domain (receipts/alerts — distinct from Nylas) | Needs a **domain + DNS** access. `RESEND_API_KEY` |
| **Google Places** | Yes (Google Cloud) | Address autocomplete | **Billing must be enabled** even on free tier. `GOOGLE_PLACES_API_KEY` |
| **Smarty** | Yes | Address verification | `SMARTYSTREETS_AUTH_ID`, `SMARTYSTREETS_AUTH_TOKEN` |
| **PostHog** | Yes (free) | Product analytics | Optional. `NEXT_PUBLIC_POSTHOG_KEY` |
| **Sentry** | Yes (free) | Error monitoring | Optional. `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |

### A note on OAuth
The only OAuth-grant flow in the codebase is **Nylas** (connecting the user's
inbox). Sign-in uses Supabase **email/password**, so you do **not** need
Google/Apple OAuth apps yet. Adding "Sign in with Google" later would mean
registering a separate OAuth app in Google Cloud.
