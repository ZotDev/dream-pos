# Dream POS — UI Design Architecture
Version: 1.0
Source of truth: supplied Asana design-context specification (neutral B2B work-management aesthetic).
Implementation: `app/globals.css`; all legacy component selectors remain available.

## 1. Design principles
- Calm competence: the product UI stays quiet; business data and workflow state are prominent.
- Minimal-maximalist: restrained surfaces, dense operational information, predictable controls.
- Functional consistency: every module uses the same navigation, page header, forms, tables, status semantics, dialogs and feedback patterns.
- Responsive-first: desktop sidebar, compact tablet navigation, mobile drawer and stacked workspaces.
- Accessibility: visible high-contrast focus, semantic status labels, keyboard-operable controls, reduced-motion support and minimum 44px touch targets.

## 2. Tokens
| Token | Value | Usage |
|---|---|---|
| Primary | #646f79 | Primary actions, selected controls |
| On primary | #ffffff | Text/icons on primary |
| Background | #ffffff | Main canvas |
| Surface | #f3f3f3 | Secondary surfaces and grouped content |
| Border | #e8e8e8 | Dividers and outlines |
| Text | #0d0d0d | Main copy |
| Muted | #555b61 | Secondary copy |
| Accent | #0d0e10 | Strong emphasis |
| Success | #18794e | Completed/approved |
| Warning | #8a5a12 | Pending/attention |
| Danger | #b42318 | Failed/blocked/destructive |

CSS variables are exposed as `--dp-*` and legacy aliases `--bg`, `--surface`, `--text`, `--muted`, `--line`, `--orange`, `--navy`, `--green`, and `--red` to avoid breaking existing pages.

## 3. Typography
- Preferred stack: TWK Lausanne, Helvetica Neue, Helvetica, Arial, sans-serif. TWK Lausanne is not bundled; system fallback is intentional.
- Display: 30px / 1.2 / weight 400.
- Heading: 24px / 1.2 / weight 500.
- Body: 14–16px / 1.5 / weight 400.
- Dense data tables may use 12px; do not use color alone to distinguish hierarchy.

## 4. Spacing and shape
4px base unit; use 4, 8, 12, 16, 20, 24, 32, 48, 64px. Radius: 4px small, 8px medium, 20px large, 32px extra-large. Use restrained 2–8px shadows; avoid decorative gradients and oversized shadows.

## 5. Application shell
1. Fixed left sidebar: brand, active store, grouped role-filtered navigation, help and profile.
2. Sticky topbar: breadcrumb, active role/store context, notifications and account actions.
3. Content canvas: page title/description, primary actions, notices, module content and footer.
4. Sidebar collapses on tablet and becomes an off-canvas drawer on mobile. Do not duplicate business navigation in page content.

## 6. Component contracts
- Buttons: 42–44px minimum height; primary is neutral gray with white text; secondary is white with neutral border; destructive actions use danger semantics and confirmation.
- Inputs: 40–44px minimum height, explicit labels, helper/error text, visible focus.
- Cards: white surface, 8–20px radius, soft border, subtle shadow only when elevated.
- Tables: sticky/clear headers where appropriate, row hover, sortable headings, filters, pagination, empty/loading/error states and mobile horizontal scroll.
- Status: pair semantic color with readable text/icon; never color alone.
- Dialogs: clear title, concise context, explicit cancel/confirm; destructive action is not the default.
- Toast/notice: announce result and provide next step for recoverable failures.
- Charts: restrained neutral palette; use semantic colors only for meaningful series/status.

## 7. Module page templates
- Dashboard: title, date/store context, KPI row, trend panel, quick actions, recent transactions, alerts.
- POS: searchable catalog, product cards, persistent cart, quantity controls, tax/discount summary, payment and invoice confirmation.
- Inventory: search/filter toolbar, stock table, low-stock state, adjustment and movement history.
- Purchases: supplier/PO header, line-item editor, tax/total summary, receive workflow and audit trail.
- Invoices: invoice register, filters, detail/print view, PDF/export/share actions, GST particulars and compliance warnings.
- Reports: date/store filters, KPI summary, chart/table, CSV export and generated-at metadata.
- HRM/Payroll: role-scoped employee records, attendance, approvals, payroll period and statutory fields.
- Settings: grouped configuration, validation, save state and audit history.

## 8. Interaction and motion
- 100ms micro-interactions, 200ms standard transitions, 300ms maximum; ease-in-out.
- Hover is supplementary, never the only indication of interactivity.
- Provide loading, disabled, success, empty and error states for every async action.
- Respect `prefers-reduced-motion`.

## 9. Responsive breakpoints
Primary layout changes at 600px (compact phone), 760px (drawer/mobile shell), 900px (compact sidebar), 1200px (content gutters), and 1440px (wide content). Use fluid widths between breakpoints; avoid fixed-width content overflow.

## 10. Accessibility acceptance
- Keyboard access to navigation, forms, menus, dialogs and tables.
- 2px high-contrast focus outline with 3px offset.
- 44px target size for primary touch controls.
- WCAG AA contrast for body text and controls.
- Visible text labels for status; meaningful accessible names for icon-only buttons.
- Reduced motion and zoom/reflow without horizontal page-level overflow.

## 11. Implementation notes and limits
- This implementation adopts the supplied Asana design-context, not a literal Apple UI. The earlier Apple-like styling is intentionally superseded by this file's neutral gray system.
- Existing React pages and CSS class hooks are retained; this pass is a global visual-system refactor, not a claim that every module's workflow has been browser-tested.
- No proprietary TWK Lausanne font asset was supplied, so a Helvetica/system fallback is used.
- The supplied source contains conflicting token prose (surface is described as both black and light gray, and typography rationale mentions 54px while token table says 30px). Implementation follows the explicit token table and the light neutral-surface descriptions.
