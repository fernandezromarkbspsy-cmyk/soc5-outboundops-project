# SOC 5 Outbound Agent Rules

## Mission
Build and maintain the SOC 5 Outbound internal linehaul request system without bypassing its role-based workflow, authentication, auditability, or real-time status rules.

## Required workflow
1. Start with `project_snapshot`, `read_project_memory`, and `git_status`.
2. Inspect existing code before proposing changes.
3. Make the smallest coherent change that solves the task.
4. Never read or display `.env`, private keys, service-account files, JWT secrets, Supabase service-role keys, or bot credentials.
5. Never change database schema, authentication, authorization, or production deployment configuration without an explicit plan and approval.
6. After code changes, run the relevant allowlisted checks through `run_quality_check`.
7. Review `git_diff` before declaring the task complete.
8. Record only durable architecture decisions in project memory; do not store secrets or temporary debugging notes there.

## Project architecture
- Frontend: React + TypeScript + Vite.
- Backend: Go + Echo.
- Database: Supabase/PostgreSQL.
- Real-time updates: SSE and/or Supabase real-time, according to the existing implementation.
- Roles: Ops PIC, FTE Ops, FTE MM, and Doc Officer.

## Safety boundaries
- Do not execute arbitrary shell commands through MCP.
- Do not delete files, reset Git, force-push, rewrite history, or modify production data.
- Do not auto-approve write operations.
- Treat user and operational data as confidential.
