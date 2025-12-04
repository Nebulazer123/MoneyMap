# MoneyMap Overview

## Vision
- Privacy-first personal finance dashboard that analyzes statements locally in the browser.
- Phase one is synthetic-only: no real uploads, bank links, or external APIs.
- Long-term: CSV upload, multi-month views, duplicate subscription detection, and calm guidance without selling data.

## Tech stack
- Next.js App Router (`app` directory) with TypeScript and Tailwind CSS.
- Dark theme layout and nav defined in `src/app/layout.tsx`.
- Key routes: `/` (landing), `/dashboard` (demo), `/about`.
- No backend or external API calls; everything runs on fake data in the browser.

## Data model
- `Transaction`: `{ id; date (ISO string); description; amount (signed); category; kind; sourceKey?; targetKey?; }`.
- Account keys (`AccountKey`) identify transfer endpoints; `TransferAccount` provides `{ id, label, ending?, ownedByDefault }`.
- Ownership map (`OwnershipMap`) marks which accounts the user owns.
- `isInternalTransfer(tx, ownership)` treats a transfer as internal only when both `sourceKey` and `targetKey` are owned; `isRealIncome` / `isRealSpending` gate income/spending math accordingly.
- All analytics helpers take the ownership map so internal transfers are ignored for income/spending totals.

## Current features
- Home page: animated hero with soft wave background, clear CTA buttons, and three intro cards. A “What you see on the dashboard” area explains the guided demo.
- Dashboard flow: guided sample statement (generate → view statement → analyze) with four summary cards that link into tabs (Overview, Recurring, Fees, Cash flow, Review). Edit transactions entry point is present as a low-profile button for future category edits.
- Overview: spending category cards with emojis, animated Recharts pie showing spending by category (with legend and leftover/net line), drill-down table by category.
- Review tab: snapshot cards, budget guidance cards, transfer ownership toggles, concise inline InfoTips.
- InfoTip pattern: small “i” buttons with hover/focus tooltips for concise inline explanations.

## Guided statement flow
- `generateSampleStatement` (`src/lib/fakeData.ts`) clones the base template, randomizes dates (same month or range) and amounts (~0.85–1.15x), sorts by date, and issues fresh IDs per run. Users can pick Month from / Month to and Year from / Year to; selections persist in localStorage.
- Flow in `src/app/dashboard/page.tsx`:
  - `idle`: start card invites generating a sample statement.
  - `statement`: shows the generated statement table with regenerate/analyze buttons (amounts color-coded by sign).
  - `analyzing`: brief spinner.
  - `results`: statement collapses by default (Show/Hide toggle), analytics tabs appear; “Start over” resets to idle. State (flow, statement, tab, month, year) persists in localStorage across navigation/refresh.
- Summary cards are interactive and jump to their respective tabs. Edit mode enables category selects and a manual “Add transaction” row that flows through all tabs; edits persist. Manual rows and edits are stored in localStorage.
- Recurring tab shows a gentle hint and “possible duplicate” pills when subscription descriptions repeat.
- Review includes budget guidance cards, a bill check summary, a needs vs wants bar, and cards for Internal transfers this month and Left after bills.
- “Your accounts” uses three-state buttons (spending, payment, not mine) and supports adding custom accounts; ownership choices persist locally.
- Analytics run only against the generated `statementTransactions` and stay ownership-aware.

## Future phases
- CSV upload with local parsing.
- Manual recategorization and corrections.
- Pie/visual charts for Overview.
- Duplicate subscription detection.
- Month/year range filters.
- Richer Review tips and insights.
