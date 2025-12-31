# Start Here Tomorrow

## Priority 1: UI Design (no code)
1. Marketing website wireframe
   - Night-sky background + subtle starfield
   - Hero + Services + Proof + Accessibility + Contact
   - Bottom-right assistant widget (always visible)

2. Owner Interaction Interface wireframe
   - Top bar (Org selector + search/command)
   - Left dock (Tasks, Pages, Files, Admin)
   - Main area (Tabs)
   - Right assistant panel + Activity Log

## Priority 2: Maintenance Language v1
- Keep only: S -> $
- Confirm punctuation handling (., , , _, $)
- Add examples:
  - "safe" -> "$1.4.3"
  - "na systems" -> "6,1._$6$537,$"
  - "fix bugs" -> "4.82,_5,75.$"

## Priority 3: Backend decisions to unlock coding
- Choose Org context method: URL scoping (/orgs/:orgId/...) OR X-Org-Id header
- Confirm RBAC roles: Owner / Admin / Member / Viewer
- Confirm Pages lifecycle: Draft + Published (+ optional version integer)

## Tomorrow deliverables
- Expanded specs:
  - docs/design/marketing-site.md
  - docs/design/owner-interface.md
- Updated language spec:
  - docs/specs/NA-Maintenance-Language-v1.md
## Decisions to lock early
- Org context: use URL scoping (/api/v1/orgs/:orgId/...)
- Roles: Owner / Admin / Member / Viewer
- Assistant UX: every action logged; destructive actions require confirmation
