# DA YI Operations Management React App

React + Supabase version of the DA YI management system.

## What This Version Adds

- Supabase Auth login
- No public registration UI
- CEO / super-admin account controls company access
- Admins create username/password accounts with predefined roles
- Role-based module access
- Supabase Postgres database for records and users
- Row Level Security policies
- Vercel-compatible serverless backend routes for protected admin actions

## Security Model

- Employees can only log in after a company admin creates a username/password account.
- Browser code only uses the Supabase anon key.
- The Supabase service-role key is used only inside Vercel serverless API routes.
- Database RLS denies access to users without an active `app_users` profile.
- The CEO role is `super_admin`; the admin API refuses to create or promote another super-admin account.

Important: also disable public sign-ups in Supabase Auth settings. RLS still protects company data if someone signs up directly, but disabling sign-up closes the front door.

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local` for local development.
4. Add the same variables in Vercel Project Settings.
5. Deploy to Vercel.
6. Call `/api/admin/bootstrap` once to create the first CEO account.

See `supabase/bootstrap-example.md`.

## Local Development

```bash
npm install
npm run dev
```

For local testing of `/api` serverless functions, use Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

## Environment Variables

Browser:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server only:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BOOTSTRAP_SECRET`

Never put `SUPABASE_SERVICE_ROLE_KEY` in client-side code.
