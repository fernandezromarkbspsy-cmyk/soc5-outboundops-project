# SOC 5 Outbound Agent Rules

## Fast workflow

1. For a normal task, call only `git_status` initially.
2. Call `project_snapshot` only when the repository structure is unknown.
3. Call `read_project_memory` only for architecture, authentication, database, deployment, or workflow changes.
4. Search only the relevant folder using `path_prefix`.
5. Use a maximum of 20 search results.
6. Read only the files needed for the current task.
7. Do not run quality checks until code has been changed.
8. After changes, run only the relevant quality check.
9. Review `git_diff` before completing the task.

## Project architecture

- Frontend: React, TypeScript, and Vite
- Backend: Go and Echo
- Database: Supabase PostgreSQL
- Real-time updates: SSE and/or Supabase Realtime
- Roles: Ops PIC, FTE Ops, FTE MM, and Doc Officer

## Safety

- Never read `.env`, private keys, JWT secrets, Supabase service-role keys, or credentials.
- Never reset Git, force-push, rewrite history, or delete project files without approval.
- Never modify production data.
- Do not execute arbitrary shell commands through MCP.
- Make the smallest coherent change required.