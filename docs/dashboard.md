# Dashboard Frontend Design

Last reviewed: 2026-07-05

The dashboard is a Next.js 16, React 19, and TypeScript application in
`frontend/`. This is the sole frontend project. It combines the migrated
request-management visual system with the SOC 5 operational screens and Laravel
API integration.

## Application shell

The Next.js App Router owns navigation. Shared providers live in `app/`, reusable
dashboard primitives live in `components/`, and the migrated SOC 5 operational
screens and adapters live in `soc5/`.

```text
frontend
|-- app/                 Next.js routes, layout, and providers
|-- components/          Shared dashboard UI
|-- soc5/                Operational workflows, API, auth, and state
|-- styles/              Global design system
`-- public/              Static assets
```

Known operational paths are handled through the App Router catch-all route so
existing bookmarks continue to work without React Router.

## Visual system

- Tailwind CSS 4 global theme: `styles/globals.css`
- Reusable component primitives: `components/ui/`
- Operational compatibility layer: `soc5/`
- Icons: `lucide-react`
- Dashboard media assets: `public/`

## State and data

- TanStack Query owns API server state, invalidation, polling, and mutations.
- Zustand stores shared search, date filters, and administrator role preview.
- Supabase JS owns browser authentication sessions.
- `lib/api.ts` sends authenticated requests to the Laravel `/api` routes.
- `useQueueNotifications` supplies pending-work counts to navigation badges.

## Access by role

| View | Authorized roles |
| --- | --- |
| Overview | All active users |
| LH Request | `ops_pic`, `fte_ops` |
| Truck Request | `fte_mm` |
| Docking Confirmation | `doc_officer`, `dock_officer` |
| KPI Analytics | `fte_ops` |
| User Management | `fte_ops`, `fte_mm` |

Frontend visibility is a convenience, not an authorization boundary. Laravel
must enforce every role and workflow transition independently.

## Responsive behavior

The dashboard shell and operational views adapt to mobile widths. Wide request
tables retain horizontal scrolling, and print-specific rules isolate truck-label
content from the surrounding application shell.

## Build verification

```powershell
cd frontend
pnpm.cmd install --frozen-lockfile
pnpm.cmd run build
```

The July 2026 frontend migration builds successfully with Next.js 16. The old
Vite application and the donor `request-management-dashboard/` project are no
longer runtime projects.
