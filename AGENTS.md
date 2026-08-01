# AGENTS.md

## AI Development Workflow

This project uses **Code Review Graph (CRG)** as the primary repository knowledge source.

Before performing any task:

1. Use Code Review Graph to analyze the repository.
2. Determine:
   - Dependency graph
   - Impact radius
   - Call graph
   - Module relationships
   - Relevant files
3. Read only the files identified by Code Review Graph.
4. Do not scan unrelated files unless Code Review Graph indicates they are required.

---

# Before Implementation

Before making any code changes:

- Explain the affected files.
- Explain why those files are involved.
- Describe the implementation plan.
- Keep changes as small as possible.

---

# After Implementation

After every implementation:

- Verify dependencies remain intact.
- Check for broken imports.
- Check for broken API contracts.
- Check for architectural regressions.
- Detect dead code introduced by the change.
- Report any newly discovered technical debt.

---

# SOC5-Outbound Project Rules

This is a production-grade internal logistics platform.

Always preserve unless explicitly instructed otherwise:

- Business logic
- Backend API contracts
- Database schema
- Authentication
- Authorization
- Role permissions
- Request lifecycle
- Supabase integration

---

# UI Modernization Rules

When redesigning UI:

Allowed:

- Layout
- Typography
- Spacing
- Components
- Cards
- Navigation
- Tables
- Charts
- Theme
- Responsiveness

Do NOT modify:

- Backend
- API contracts
- Business rules
- Zustand stores
- Supabase queries
- Database schema

unless explicitly instructed.

---

# Refactoring Rules

Before refactoring:

- Determine impact radius using Code Review Graph.
- Show affected modules.
- Refactor only affected files.
- Avoid unrelated cleanup.

---

# Debugging Rules

Before debugging:

Use Code Review Graph to determine:

- Call chain
- Dependencies
- Upstream callers
- Downstream consumers

Fix the root cause instead of symptoms.

---

# Performance Review

When optimizing:

Identify:

- Circular dependencies
- Large components
- Duplicate logic
- Dead code
- Expensive renders
- Unnecessary API calls

Rank findings by impact.

---

# Architecture Review

When reviewing architecture:

Evaluate:

- Coupling
- Cohesion
- Dependency direction
- Module boundaries
- Reusability
- Maintainability

Provide actionable recommendations.

---

# Preferred Development Workflow

Always follow this sequence:

1. Analyze using Code Review Graph.
2. Determine dependency graph.
3. Determine impact radius.
4. Read only relevant files.
5. Explain implementation.
6. Implement.
7. Validate architecture.
8. Verify dependencies.
9. Summarize changes.

---

# General Coding Standards

- Keep components modular.
- Prefer composition over duplication.
- Keep files focused.
- Preserve existing conventions.
- Write readable code.
- Minimize unnecessary changes.
- Never perform large-scale refactors unless requested.

---

# Repository Context

Technology Stack

Frontend
- React
- TypeScript
- Vite

Backend
- Laravel (PHP)

Database
- Supabase

Analysis Tool
- Code Review Graph (MCP)

Primary AI Assistant
- Antigravity (AGY)

Secondary AI
- Gemini CLI

Additional AI
- Codex
- Claude Code

Whenever Code Review Graph tools are available through MCP:

- Prefer Code Review Graph over manual repository scanning.
- Use dependency analysis before opening files.
- Use impact analysis before implementation.
- Use graph queries whenever possible.