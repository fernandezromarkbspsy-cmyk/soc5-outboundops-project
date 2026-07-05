# SOC5 frontend migration

This Next.js application is now the frontend for the existing Laravel and Supabase services. The Laravel code, API routes, authorization rules, and database behavior remain unchanged.

## Local setup

1. Start the Laravel API on `http://127.0.0.1:8000`.
2. Copy `.env.example` to `.env.local` and provide the Supabase browser values.
3. Install dependencies with `pnpm install`.
4. Start the frontend with `pnpm dev`.

The browser calls `/api`. During local development and in the production server, Next.js proxies that path to `API_ORIGIN`, which defaults to `http://127.0.0.1:8000`.

## Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Browser | API path; normally `/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser | Supabase publishable/anon key |
| `API_ORIGIN` | Next.js server | Internal Laravel origin used by the `/api` rewrite |

Never place the Supabase service-role key in a `NEXT_PUBLIC_*` variable.

## Preserved functionality

- Supabase OAuth, OTP, and backroom authentication
- Forced password-change flow
- Role-aware navigation and administrator role simulation
- Outbound and midmile request queues
- Request creation, editing, approval, rejection, assignment, docking, and confirmation
- Request filters, pagination, exports, and printable labels
- Notifications and queue polling
- KPI, operational overview, and user administration

## Verification

Run `pnpm exec tsc --noEmit` and `pnpm build`. TypeScript build-error suppression has been removed, so production builds fail on type errors.
