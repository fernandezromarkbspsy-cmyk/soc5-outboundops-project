# Refactoring Backlog

This is the master backlog of all refactoring, technical debt, performance, and testing‑gap items discovered during implementation sprints.

---

## Backlog Table

| ID | Sprint Discovered | Category | Priority | Status | Component | Description | Business Impact | Recommendation | Dependencies | Notes |
|----|-------------------|----------|----------|--------|-----------|-------------|----------------|----------------|--------------|-------|
| RF-001 | Sprint 1 | Technical Debt | High | Open | `src/components/Button.tsx` | Duplicate button variant with identical markup | Reduces maintainability; risk of inconsistent UI changes | Consolidate into a single reusable Button component | None | |
| RF-002 | Sprint 2 | Performance | Medium | Open | `src/pages/Orders.tsx` | Unnecessary re‑render on every store update | Increases CPU usage on high‑traffic pages | Memoize component with `React.memo` | Dependent on state‑management refactor | |
| RF-003 | Sprint 2 | Legacy Cleanup | Low | Open | `src/styles/legacy.scss` | Unused legacy SCSS file | No functional impact but inflates bundle size | Delete file and remove import | None | |

---

## How to Add a New Entry
1. Copy a table row above and fill in the fields.
2. Use the **ID** pattern `RF-XXX` (incremental).
3. Set **Priority** and **Status** according to definitions in `README.md`.
4. Commit the change to the `docs/refactoring/REFACTORING_BACKLOG.md` file.

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026‑08‑01 | Antigravity (AGY) | Created backlog template with example rows |
