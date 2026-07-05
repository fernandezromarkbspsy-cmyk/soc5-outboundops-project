# Feature Breakdown

Last reviewed: 2026-07-05. Phases 1 through 3 are represented in the current
codebase; production-readiness work remains iterative.

## Phase 1 - Foundation

- Supabase project, schema, indexes, RLS, seed administrator
- Laravel health endpoint, JWT verification, profile lookup, rate limiting
- React shell, AdminKit visual system, login, role guards, API client, error boundary

## Phase 2 - Request lifecycle

- Create/list/detail requests with pagination and filters
- Approve, bulk approve, edit, cancel, reject, assign, dock, confirm
- Transactional events and notification fan-out
- State-transition and authorization tests

## Phase 3 - Operations

- Realtime notifications, toast/sound preference, event timeline
- User create/update/disable
- Daily KPI cards and export
- Google Sheet one-time import with validation report

## Phase 4 - Production readiness

- CI lint/type/test/build pipeline
- Backup and restore drill
- Sentry/PostHog/Better Stack adapters when configured
- Load test expected concurrency; optimize only observed bottlenecks
