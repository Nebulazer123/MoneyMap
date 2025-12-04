# MoneyMap Dev Notes

## Design
- Dark, calm dashboard aesthetic—serious banking feel, no flashy gradients.
- Layout relies on simple cards and tables; keep it clean and readable.
- Disclaimers must keep the experience “demo only” even if the dashboard reads like a real statement.

## Coding conventions
- Next.js App Router with TypeScript; use functional React components.
- Tailwind utility classes instead of separate CSS files.
- Analytics logic lives in pure helpers under `src/lib` (e.g., `getSummaryStats`, `getSpendingByCategory`, `getCashFlowByDate`, `getBudgetGuidance`).
- Always pass the ownership map into new analytics helpers so internal transfers are handled correctly.
- Statement generation sorts rows by date; amounts show green/red by sign. Statement hides after analysis by default with a Show/Hide toggle. Flow, statement, and tab state persist in `localStorage`.
- Date selections (Month from/Month to, Year from/Year to) live in state and `localStorage`; the full generated statement is serialized once and restored on load, with filtered views applied to the in-memory list.
- Manual transactions appended in edit mode and ownership modes (three-state) are persisted in `localStorage` and reused on refresh.

## Analytics rules
- Internal transfers between owned accounts are never counted as income or spending.
- Transfers to/from unowned accounts are treated as inflow or outflow.
- Summary cards and the Review tab must stay consistent with `getSummaryStats`.
- Any new feature touching money amounts must use the shared guard helpers to respect ownership and transfer logic.
- Overview pie chart uses Recharts with stable category color and emoji maps. Keep colors/emoji aligned with category cards.
- Edit transactions entry point in the tab row is intentionally low profile; future editing should respect the same ownership and totals rules.
- Manual transactions appended in edit mode are stored in state and `localStorage` and feed all analytics immediately.
- Recurring duplicate detection uses description text matches (case-insensitive); show the hint and pill when a description repeats in the view window.
- Essentials vs other (Needs vs wants bar) uses Rent, Utilities, Groceries, and Fees as essentials; everything else is other.

## UX voice
- Copy is short, neutral, and non-dramatic.
- Disclaimers about synthetic/fake data live in the top banner and tooltips, not repeated in every line.
- Use the `InfoTip` component for concise, readable explanations.
- Dashboard headers use concise labels (“Budget guidance”, “Transfer checks”); tooltips stay short and calm.
- Keep wording human and plain; avoid robotic/legal phrasing.
- Limit tooltips to three short lines; prefer calm, direct sentences over legal copy.

## How to use Codex on this repo
- Codex must read `docs/moneymap_master_map.md` first before the other docs.
- Read `docs/moneymap_overview.md` and `docs/moneymap_dev_notes.md` before coding.
- Keep changes small; validate with `npm run lint` and manual testing of `/`, `/dashboard`, and `/about`.
