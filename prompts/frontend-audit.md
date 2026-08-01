  ### 🔍 1. Repository Analysis Summary

  The audit identified several UX, responsiveness, accessibility, and maintenance risks in the frontend without
  requiring any backend, database, or auth logic changes:

  • P0 - Mobile layout root lock: html and body set min-width: 1180px, blocking responsive CSS rules on small screens.
  • P0 - Text Encoding / Mojibake: Punctuation and fallback characters in header and page headers are rendered
  incorrectly.
  • P1 - Duplicate / Overlapping SCSS System: Conflicting styles for topbar (.app-topbar), metrics (.metric-card),
  and table borders create visual inconsistencies.
  • P1 - Hardcoded Trend Badges: Pseudo-elements in SCSS hard-code +2.54% and -2.67% trends on metric cards.
  • P1 - Dead Sort Button: Non-functional Sort By button affordance in request filters.
  • P2 - Dialog & Accessibility Hardening: Modals and menus lack keyboard trap/escape handling, click-outside close,
  and explicit screen-reader bindings.
  • P2 - Loading & Performance: Table loaders are generic text; missing route-level lazy loading (React.lazy).
  ──────
  ### 🛠️ 2. Proposed Implementation Plan

  #### Phase 1: Critical Layout & Encoding Fixes (P0)

  1. Root Layout Fix:
      • Remove root-level min-width: 1180px from html and body in main.scss.
      • Scope desktop minimum widths strictly to table containers so mobile table-card transformation can activate
      cleanly below 760px.
  2. Text Encoding Cleanup:
      • Replace mojibake punctuation characters with standard ASCII equivalents (-, ..., etc.) in AppHeader.tsx,
      Kpi.tsx, and UserManagement.tsx.


  #### Phase 2: Visual System Consolidation (P1)

  1. SCSS Cleanup & Token Standardization:
      • Remove duplicate/competing .app-topbar and .metric-card::after styles in main.scss.
      • Standardize border radii, shadow elevations, and flat operational surfaces.
      • Remove fake hardcoded trend percentages (+2.54%) from metric card pseudo-elements.
  2. Filter & Sort Fix:
      • Remove or connect the dead Sort By button in RequestFilters.tsx.


  #### Phase 3: Accessibility & Component Upgrades (P2)

  1. Accessible Dialog & Menu Primitives:
      • Create shared modal/popover primitives with escape-key listeners, focus trapping, and aria-labelledby
      semantics.
      • Update modal dialog usage across OutboundRequests.tsx, MidmileRequests.tsx, and DockingConfirmation.tsx.
  2. Skeleton Loading States & Code Splitting:
      • Replace generic loading text with skeleton table views during initial queue loading.
      • Apply React.lazy to route imports in App.tsx for route-level code splitting.

  ──────
  ### 📂 3. Affected Files

  • main.scss
  • AppHeader.tsx
  • RequestFilters.tsx
  • RequestTable.tsx
  • Kpi.tsx
  • UserManagement.tsx
  • OutboundRequests.tsx
  • MidmileRequests.tsx
  • DockingConfirmation.tsx
  • App.tsx
  ──────