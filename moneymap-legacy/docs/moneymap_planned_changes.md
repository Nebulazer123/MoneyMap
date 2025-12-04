# MoneyMap planned changes backlog

This file is the authoritative backlog for the MoneyMap demo app.  
It describes the *target* behavior for the home page, dashboard, charts, editing tools, and review guidance.

Use this doc when:
- Bootstrapping a fresh Codex session
- Deciding what to build next
- Checking whether the UI still matches the original vision

---

## 1. Home page – hero and disclosure

### 1.1 Hero copy

Target hero structure:

- Top eyebrow: `PHASE ONE DEMO`
- Main heading: `MoneyMap`
- Tagline: `Stress test your spending without sharing real data.`
- Disclosure line (plain text under tagline):

  > This is a sample dashboard that runs on fake, randomly generated data only. It never connects to a bank or stores your statements.

Notes:
- Keep wording simple and human, not “legal.”
- “Sample” / “fake data” is fine here because it is a required disclosure.
- No AI-ish phrases like “no real data is touched.”

### 1.2 “How this demo works” section and Learn more behavior

There are two layers to this:

#### A. Section on the home page

Keep a section labeled `How this demo works` on the home page.

The three cards should have short, human titles:

1. `Watch a messy statement appear`
2. `See real spending separate from transfers`
3. `Get a clear snapshot of subscriptions and fees`

Default copy under each title should be short and clear.

On hover or focus:
- The entire card slightly enlarges and lifts.
- The background and border become slightly brighter.
- The body text is replaced by a “step” style description.

Suggested hover copy:

Card 1 – Step 1  
- Heading: `Step 1 – Drop in a messy month`
- Body: “Upload or copy in paychecks, bills, and small purchases – basically the statement that feels too messy to look at.”

Card 2 – Step 2  
- Heading: `Step 2 – Let MoneyMap sort the clutter`
- Body: “We mark which accounts are yours so transfers between them are not counted as spending, then group everything else into clear categories.”

Card 3 – Step 3  
- Heading: `Step 3 – Spot subscriptions and fees`
- Body: “See a clean ledger of subscriptions, fees, and problem areas so you know where money is leaking.”

Tone:
- Marketing-friendly but calm.
- No technical jargon and no AI buzzwords.

#### B. Learn more modal / walkthrough

The `Learn more` button on the hero should open a centered overlay, not just scroll.

Overlay behavior:
- Title: `How this demo works`
- Full-width content area with three slideable cards (or next/prev arrows):
  - Card 1, 2, 3 as above (Step 1 / Step 2 / Step 3).
- After the three slides, show a final slide / section:

  `What you’ll see on your dashboard`
  - Bulleted list of 3–4 items, for example:
    - “Your net for the month”
    - “Spending by category”
    - “Recurring subscriptions and fees”
    - “Simple budget guidance based on your income”

Close behavior:
- Clear `Close` button.
- Clicking outside the modal also closes it.

---

## 2. Home page – background

- Keep a subtle animated background behind the hero (current wave effect is fine).
- Motion must be low-key and not distract from text.
- Future option: swap to a dark, soft “map” style background image; animation should still stay subtle.

Implementation notes:
- Container: hero is `position: relative` with `overflow: hidden`.
- Background waves are absolutely positioned layers below the text and buttons.

---

## 3. Dashboard header and disclosures

### 3.1 Title and eyebrow line

- Main heading: `Dashboard`
- Subline directly under title should be simple:

  > Phase one demo using sample data only.

- Remove “no real uploads or bank links” from the visible subline.

### 3.2 Dashboard info tooltip

Add an InfoTip icon inline with the `Dashboard` title.

Tooltip text (max three short lines):

> This is demo data only.  
> It uses random sample transactions.  
> No real banking information is used.

The tooltip is the place where we mention “no real uploads or bank links,” not the visible line.

---

## 4. Sample / demo statement panel

### 4.1 Naming

Everywhere in the UI, use `Demo statement` instead of `Sample statement` for the main header on the Dashboard.

The “start” card text should read:

- Heading: `Start your demo analysis`
- Body: `MoneyMap will generate a randomized demo statement and analyze it locally.`  
  (Do not add “No real data is touched” here – that’s already covered by the dashboard tooltip.)

When the statement exists, the header above the table should read:

`Demo statement`  
Subline: `Randomized monthly transactions – income, bills, subscriptions, fees, and transfers.`

### 4.2 Month and year controls (Part A)

Goal: The user can pick which month/year the demo statement uses, and those settings persist.

Under the `Demo statement` header:

- Add a compact controls row with:
  - Month select: `Jan` through `Dec`
  - Year select: at least the year used now (e.g., `2025`), extensible later

Behavior:
- Store selected month and year in React state.
- Persist to localStorage with keys like:
  - `moneymap_month`
  - `moneymap_year`
- On `Generate demo statement`:
  - Pass the selected month/year into `generateSampleStatement(monthOverride, yearOverride)` so transaction dates are in that month.
- On initial load:
  - Read month/year from localStorage if present.
  - Regenerate the statement so the visible month label and table data match.
- Current behaviors that must remain:
  - Dates sorted in chronological order.
  - Positive amounts are green; negative amounts are red.
  - “Show statement / Hide statement” toggle still works.
  - `Start over` resets:
    - Flow state
    - Month and year back to defaults
    - LocalStorage entries for month/year and statement.

Implementation hint:
- `generateSampleStatement(monthOverride?: number, yearOverride?: number)` should:
  - Use base year/month from the original seed date.
  - Override with provided month/year when present.
  - Keep everything else (description, category, sign) the same.

---

## 5. Editing the demo statement

### 5.1 Edit mode basics (current behavior plus tweaks)

There are two edit entry points:

1. `Edit transactions` button in the controls row near the tabs.
2. A second `Edit transactions` action inside the Demo statement panel when the statement is visible.

Behavior:
- Clicking either `Edit transactions` enters edit mode:
  - Button label toggles to `Done editing`.
  - Demo statement table expands (if it was hidden, show it).
  - Category cells show `<select>` controls using the standard category options.
  - Edits immediately update:
    - Statement state
    - LocalStorage
    - All analytics (Overview, Recurring, Fees, Cash flow, Review)
- Clicking `Done editing`:
  - Leaves changes applied.
  - If the user leaves the Dashboard and comes back, edited data is restored from localStorage.

Helper line:
- When editing, show a small note under the Demo statement header, for example:

  > Editing categories and amounts only affects this demo run. It never touches real accounts.

### 5.2 Manual “Add transaction” row (Part B)

In edit mode, at the bottom of the Demo statement table:

- Add a compact row with inputs:
  - Date:
    - Date input tied to the selected month and year.
    - Defaults to a day within that month (e.g., first or last).
  - Description:
    - Text input.
  - Category:
    - Select using the same options as other category controls.
  - Amount:
    - Numeric input that accepts positive or negative values.
    - `$` symbol sits outside the input so user doesn’t type it.

- Add a small `Add` button on the row.

On `Add` click:
- Validate basic fields (non-empty description, numeric amount).
- Append a new transaction to the current statement state.
- Recalculate all derived analytics immediately.
- Persist the full updated statement to localStorage so the new row survives navigation and refresh.
- Show the new row in:
  - Demo statement table
  - Appropriate tabs (Recurring, Fees, Cash flow, Overview, Review) based on category and sign.

Style:
- Low-profile row; does not visually overpower the existing table.
- Works well on smaller widths.

### 5.3 Grouping transactions by description (planned)

Goal: Let users quickly group multiple similar transactions under a custom description label.

High-level flow:
1. User enters a “group mode” from the Demo statement area (future button like `Create a group`).
2. In group mode:
   - A checkbox column appears to the left of each description cell.
3. User selects one description row as the seed.
   - System auto-selects other rows where the *first three words* of the description match.
4. User can:
   - Deselect any auto-selected rows.
   - Manually select additional rows.
5. At the top of the table:
   - Show an input box for a group name and a `Save` button.
6. On `Save`:
   - All selected rows are renamed to the group description.
   - Category defaults to:
     - The category of the original seed transaction, but user can override.
   - Changes are saved to localStorage and analytics updated.

Clarifications:
- Grouping is about **descriptions**, not categories.
- Category is optional to edit; default stays aligned to original seed transaction.

This feature is **planned**, not implemented yet; keep it separate from existing Edit behavior.

---

## 6. Overview tab and spending pie

### 6.1 Overview header copy

Current header text:

> High-level breakdown of spending this month.

Replace with something friendlier, for example:

> Where your money went this month.

Remove the redundant line at the bottom that says:

> Click a category card to drill in.

The cards already look clickable; no need for instructional text.

### 6.2 Category cards

- Each category card (Rent, Groceries, Dining, Fees, Subscriptions, Utilities, Transport, Other) should:
  - Show an emoji matching the category.
  - Show the category name and dollar amount.
- The cards are clickable; clicking a card:
  - Filters the transactions table below to that category.

### 6.3 Spending pie chart

Target behavior:

- Full pie (no donut hole).
- Larger size; easy to read at a glance.
- No outer stroke that covers small slices.
- Colors:
  - Strong, distinct, but still compatible with dark theme.
  - Stable between renders so categories don’t change colors randomly.

Category grouping for the pie itself (not for the cards):

- `Rent & utilities` – rent + utilities categories.
- `Groceries & dining` – groceries + dining.
- `Transport` – transport category.
- `Subscriptions` – all subscription spending.
- `Other (incl. fees)` – fees and everything else.

Legend:
- Place a legend below or alongside the pie.
- Each row shows:
  - Emoji
  - Group name
  - Percent of total spending (bold)
  - Dollar amount (secondary)

Example legend line:

> 🍽 Groceries & dining – 32% · $850.21

Percent is more important than the dollar amount here.

“Left after bills”:
- Remove any “Left after bills” note from the Overview pie legend.
- This will be moved to the Review tab as its own box.

---

## 7. Recurring tab

### 7.1 Category meaning

Goal: Make the Recurring tab reflect things people actually pay every month.

- Recurring table should include:
  - Subscriptions: streaming, gym, storage, etc.
  - Bills: phone, internet, utilities, insurance, etc.
  - Loan and mortgage payments.
  - Any other payment that clearly repeats monthly.

Keep the `Category` column, but:
- Ensure true “Bills” (things you must pay) are categorized differently from “Subscriptions” (nice-to-have services).
- Later we can refine categories like:
  - `Bills`
  - `Subscriptions`
  - `Loans`

### 7.2 Duplicate subscription hint (Part C)

In the Recurring tab:

- Look at rows for the current month.
- If a given description appears more than once:
  - Show a gentle hint line above the table:

    > Some subscriptions show up more than once this month. You may want to check for double charges.

- For each duplicate row:
  - Add a subtle pill next to the name:

    `possible duplicate`

Styling:
- Small rounded pill.
- Soft border and subtle text color.
- Visual nudge only; not a warning or error.

---

## 8. Fees tab

- Keep the current fees table: name, amount, date.
- Header: `Fees` with subline `Bank and service fees charged this month.`
- Add a small InfoTip next to `Fees` that explains:

  > Things like ATM network fees, late payment fees, and maintenance fees land here.

No behavioral change required yet.

---

## 9. Cash flow tab

### 9.1 Naming

- Tab label: `Daily cash flow`
- Section header: `Daily cash flow`
- Subline: `Daily money in and out for this month.`

Add an InfoTip icon next to the `Daily cash flow` title:

> Each row shows net inflow and outflow for that day.  
> Transfers between your own accounts are excluded.

### 9.2 Per-day drill-down

For each row in the Daily cash flow table:

- Add a subtle arrow icon (or expand caret) on the row.
- Clicking the row or arrow:
  - Expands a nested section that lists individual transactions for that day:
    - Date
    - Description
    - Amount (colored by sign)
  - Clicking again collapses.

Implementation:
- Simple state keyed by date string.
- Keep styling light; no heavy borders.

---

## 10. Review tab

### 10.1 Snapshot row layout

Existing cards at the top:

- `Snapshot`
- `Subscriptions`
- `Fees`
- `Top spending categories`

These remain, but titles should be a bit more visually emphasized (slightly brighter text, not overdone).

`Largest expense` in the Fees card:
- Make the label clickable.
- On click, show the underlying transaction:
  - Date
  - Description
  - Amount
- Can be a tiny popover or a line revealed under the card.

### 10.2 Internal transfers and leftover cash boxes

Current behavior:
- Internal transfers are shown as a small gray line under the Snapshot card.
- “Left after bills” exists in the Overview section.

Target behavior:

- Add a row of three portrait-style cards under the main four cards:

  Left card:
  - Title: `Internal transfers`
  - Shows the total internal transfer amount for the month.
  - Short line of text explaining:

    > Money moved between accounts you marked as yours. It is not counted as spending.

  Center card:
  - Placeholder for future use:
    - Keep an empty but styled card with title like `Coming soon`.
    - Short line: `We’ll add another key insight here later.`

  Right card:
  - Title: `Left after bills`
  - Shows net income after “essential” bills (rent, utilities, groceries, basic fees).
  - Short line:

    > What’s left after essentials this month.

Internals:
- Calculations themselves already exist elsewhere; this is a layout change, not a math change.

### 10.3 Budget guidance wording (Part D)

Under `Budget guidance`:

- Keep the existing category-by-category budget comparison cards.
- Remove any mention of:

  > Transfers between your own accounts are ignored for income and spending here.

That information lives elsewhere (e.g., in tooltips or Internal transfers card).

Add a small “bill check” summary area inside the Budget guidance section:

- Use existing analytics to estimate:
  - Percent of income going to `Transport` (car costs etc.)
  - Percent of income going to any recurring row whose description contains `Internet`, `Wifi`, or `Cable`.

Show short sentences such as:

- `Car and transport are about X% of your income this month. A common target is roughly up to Y%.`
- `Internet or home connection is about Z% of your income this month.`

Guidelines:
- Use a simple fixed Y (for example, 15–20%) as a rough benchmark.
- Tone is calm and practical, not judgmental.

### 10.4 Needs vs. wants bar (Part E)

Still in the Review tab, inside the Budget guidance area:

- Define “essentials” as spending in categories:
  - Rent
  - Utilities
  - Groceries
  - Basic Fees (e.g., bank fees, necessary service charges)

- “Other” is everything else.

Render a thin horizontal bar:

- Left segment: essentials proportion.
- Right segment: other spending.
- Under or inside the bar, show labels:

  - `Essentials NN%`
  - `Other MM%`

Implementation:
- Use flexbox and divs; no new chart library.
- Purely visual; does not affect calculations elsewhere.

### 10.5 Review tooltip cleanup (Part F, Review-specific)

- Keep section names `Budget guidance` and `Transfer checks` (which will be renamed in the next section).
- Tooltips:
  - At most three short lines.
  - Avoid robotic or legal phrasing.
  - Example for Budget guidance:

    > Rough ranges based on your income.  
    > Real life is messier – this is just a starting point.

---

## 11. “Transfer checks” → “Your accounts” section

### 11.1 Rename and intent

Rename the `Transfer checks` section to `Your accounts`.

Goal:
- Let users tell MoneyMap which accounts are theirs and which are payment destinations, so internal transfers and payments are handled correctly.

### 11.2 Account rows

For each recognized account:

- Show:
  - Account label (e.g., `Navy Federal checking ending 3124`).
  - Account type tag:
    - `Checking`
    - `Savings`
    - `Debit`
    - `Credit`
    - `Loan`
    - `Mortgage`
    - `Other` (fallback)

### 11.3 Account classification buttons

Instead of just `Yes, my account` / `No, not mine`, there should be three clear options:

1. `My account` (green)
2. `Not mine` (red or muted)
3. `Payment account` (orange) – for loan and credit card accounts where sending money to them is usually a payment.

Behavior:
- `My account`:
  - Transfers between two “My account” entries are treated as internal and excluded from income/spending.
- `Payment account`:
  - Transfers from a “My account” to a “Payment account” are treated as spending (debt/loan payments).
- `Not mine`:
  - Transfers involving `Not mine` accounts are treated as external and handled conservatively (do not try to classify as internal transfers).

InfoTip next to `Your accounts` title:

> Mark which accounts belong to you and which ones are payment targets.  
> This helps MoneyMap separate internal moves from real spending.

### 11.4 “Add account” flow using grouping logic

Add an `Add account` button to this section.

Flow:

1. Clicking `Add account` opens a small wizard or overlay tied to the Demo statement.
2. The user selects one transaction row that represents an account (e.g., a transfer to or from a specific account label).
3. MoneyMap scans the Demo statement and auto-selects other rows that look like the same account (using description and possibly memo fields).
4. User can:
   - Deselect mismatched rows.
   - Select additional matches.
5. User enters an account name and chooses an account type (Checking, Savings, Credit, Loan, Mortgage, Other).
6. On save:
   - All selected rows are tagged as involving this account.
   - The account appears in the `Your accounts` list with its three classification buttons.
   - Internal transfers logic updates accordingly.

Implementation can reuse the grouping UI from section 5.3.

---

## 12. Copy and tone guidelines (Part F global)

Applies to `src/app/page.tsx`, `src/app/dashboard/page.tsx`, and future copy:

- Headings:
  - Short, concrete, and human.
  - Avoid “high-level,” “overview,” or other corporate phrasing unless it truly adds meaning.
- Subheadings:
  - One simple sentence.
  - Aim for 6–14 words.
- Tooltips:
  - Max three short lines.
  - No passive voice where possible.
  - Avoid phrases like:
    - “These are guidelines, not rules.”
    - “No real data is touched.”
    - “As an AI model…”
- Voice:
  - Calm, direct, and mildly conversational.
  - Feels like a smart friend who tracks money, not a banker or a robot.

---

## 13. Part A–F implementation notes and docs

When the above parts are implemented, the documentation should reflect it.

### 13.1 moneymap_overview.md should mention:

- Month and year controls for the Demo statement.
- Manual add transaction in Edit mode and how it flows through all tabs.
- Duplicate subscription hints in Recurring.
- The simple bill check sentences in Review.
- The needs vs wants bar in Review.
- The new `Your accounts` behavior and three-state classification.
- The relocated “Left after bills” box.
- Basic flow:
  - Generate demo statement.
  - Analyze.
  - Explore Overview, Recurring, Fees, Daily cash flow, Review.

### 13.2 moneymap_dev_notes.md should include:

- How month and year are stored in state and localStorage.
- How the demo statement itself is serialized in localStorage and restored.
- How manual transactions are appended and included in analytics.
- The duplicate detection rule for subscriptions (matching description text).
- The buckets used to compute essentials vs other spending.
- How account classification affects internal transfer logic.
- Short reminders about tone and copy (see section 12).

---

## 14. Validation checklist

After each batch of changes:

- Run `npm run lint` and fix all issues.
- Manual verification:
  - Month/year controls:
    - Regenerate statements based on chosen month/year.
    - Survive navigation to Home / About and back.
    - Survive page refresh.
  - Manual transactions:
    - Appear in the Demo statement.
    - Show up where expected in Overview, Recurring, Fees, Daily cash flow, and Review.
    - Persist after refresh.
  - Recurring:
    - Duplicate descriptions trigger the hint and `possible duplicate` pills.
    - Non-duplicates show no hint or pills.
  - Review:
    - Budget guidance shows bill check sentences with reasonable numbers.
    - Needs vs wants bar adds up to 100% visually.
    - Internal transfers and Left after bills appear as portrait boxes with sane values.
  - Your accounts:
    - Account type tags are correct.
    - Three-state buttons behave as specified.
  - Copy:
    - Home, Dashboard, and About pages read simple and human.
    - No robotic or overly legal lines remain.

---

## 15. How to save and use this file

1. In your repo, create a `docs` folder if it does not exist yet.
2. Inside `docs`, create a new file named:

   `moneymap_planned_changes.md`

3. Paste this entire markdown content into that file and save.
4. Commit it to git so Codex and future sessions always have access.
5. In future Codex sessions, start with a prompt like:

   > Load docs/moneymap_overview.md, docs/moneymap_dev_notes.md, and docs/moneymap_planned_changes.md. Summarize the current state and the open planned changes in 10 bullets, then wait for instructions.

This keeps the project vision, UX rules, and backlog synced across tools and sessions.
```
