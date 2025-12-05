# MoneyMap Phase 2 Implementation Plan

> **Authoritative Source:** `Phase2Plan_Unrevised.md`  
> **Generated:** December 5, 2025  
> **Status:** Planning Phase - Awaiting User Approval

---

## Table of Contents

1. [Global Rules & Model Routing Strategy](#1-global-rules--model-routing-strategy)
2. [Phase Overview Summary](#2-phase-overview-summary)
3. [Model Assignment Reference](#3-model-assignment-reference)
4. [Phase 1 — UI, Layout, Light Behavior](#4-phase-1--ui-layout-light-behavior)
5. [Phase 2 — Deep Logic, APIs, Data & Math](#5-phase-2--deep-logic-apis-data--math)
6. [Phase 3 — Final Polish & QA](#6-phase-3--final-polish--qa)
7. [API Integration Details](#7-api-integration-details)
8. [Testing & Verification Strategy](#8-testing--verification-strategy)
9. [Concerns, Open Questions & Blockers](#9-concerns-open-questions--blockers)

---

## 1. Global Rules & Model Routing Strategy

### 1.1 Planning-Only Rules

- [ ] **You are only making a plan right now**
  - [ ] You can look around the site, read files, and analyze, but **do not start implementing changes yet**
  - [ ] Put real time into building the plan

- [ ] Create and maintain this document **`PLAN.md`**
  - [ ] This Phase2Plan text is the blueprint you follow to build this `PLAN.md`
  - [ ] `PLAN.md` must be long, detailed, and organized as **checkbox to-do lists**, not prose descriptions

### 1.2 Bible Treatment of User Instructions

- [ ] Treat every piece of text from the user as **bible**
  - [ ] Do **not** simplify away details
  - [ ] Do **not** remove examples, even if you think you "understand" them
  - [ ] Only **organize** and add clear implementation steps and structure

- [ ] When building `PLAN.md`, you can be creative in how you:
  - [ ] Name components or files (for clarity)
  - [ ] Organize tasks into groups and phases
  - [ ] Add helpful comments or concerns
  - [ ] But you cannot ignore or contradict any instruction in this document

### 1.3 Chrome Preview Usage

- [ ] Use **Chrome Preview** / browser tools:
  - [ ] Open the site and analyze any UI/UX or data problems
  - [ ] Visit the website whenever confused about what a section looks like
  - [ ] Use browser preview again **after fixes** to verify each issue is resolved
  - [ ] Site is available at: `http://localhost:3000/`

### 1.4 Commands to Run

- [ ] Commands to run while implementing:
  - [ ] `npm run lint` — check for lint issues
  - [ ] `npm run dev` — while developing and testing pages
  - [ ] Re-run lint/dev whenever you finish a chunk of work
  - [ ] Only run `npm run build` **after the entire to-do list for the current phase is done** and you expect a successful build
  - [ ] **`npm test` runs are only required at the end of each phase, not after every prompt**

### 1.5 Phased Workflow Critical Constraints

- [ ] **Phase 1** — non-deep reasoning, no heavy math or logic, just simple UI edits, quick fixes, moving components, basic behavior wiring. No big file-building or deep error research.
- [ ] **Phase 2** — deeper, higher-risk logic: APIs, transaction analysis/creation/randomization/organization, math and date logic, deep bug hunting.
- [ ] **Phase 3** — final review and polish: verify everything works functionally with new updates, fill remaining gaps, make it "pretty", add organized, tasteful animations/colors, and run full testing.

> [!CAUTION]
> **Never solve work from two or more phases in the same response/commit.**  
> Finish one phase, stop, present results, and wait for user review before starting the next.

### 1.6 Model Routing Guidelines

#### Available Models & Their Purposes

| Model | Best For | Token Pool |
|-------|----------|------------|
| **Gemini Low** | Quick checks, light edits, shallow reasoning, simple clarifications, repetitive tasks | Gemini Pool |
| **Gemini High** | More detailed reasoning, medium-complex planning, heavier context, Google ecosystem tools | Gemini Pool |
| **Claude Sonnet 4.5** | Balanced work, structuring, organizing, rewriting prompts, checklists, medium-complex planning | Claude Pool |
| **Claude 4.5 Thinking** | Deeper multi-step reasoning, tricky logic, careful step-through | Claude Pool |
| **Claude Opus 4.5** | **Heavy reasoning, complex logic, deep analysis, math-heavy thinking, ALL math and logic requests** | Claude Pool |

> [!IMPORTANT]
> **Prioritize Claude Opus 4.5 for:**
> - All math and logic requests
> - Non-trivial math calculations
> - Detailed logical branching
> - Deep architecture or data decisions
> - Complex suspicious charge detection algorithms
> - Transfer netting and financial calculations

### 1.7 Fallback & Stuck Handling

- [ ] If you try and try and can't figure something out **without outside help**:
  - [ ] Clearly state where you're stuck and what you tried
  - [ ] Leave a note in `PLAN.md` for the user

### 1.8 End-of-Prompt Requirement

At the **end of every prompt/response**, always include:
1. **What we should do next** — clearly state the next action or focus
2. **What model you recommend** — example: "Recommended model: Claude Opus 4.5"

---

## 2. Phase Overview Summary

### Phase Summary Table

| Phase | Focus Area | Risk Level | Primary Models |
|-------|------------|------------|----------------|
| **Phase 1** | UI, Layout, Light Behavior | Low | Gemini Low/High, Claude Sonnet |
| **Phase 2** | Deep Logic, APIs, Data & Math | High | Claude Opus, Claude Thinking |
| **Phase 3** | Final Polish & QA | Medium | Mixed — Sonnet for UI, Opus for verification |

### Estimated Step Counts

- **Phase 1:** ~15-20 major task groups
- **Phase 2:** ~25-30 major task groups (most complex)
- **Phase 3:** ~10-15 major task groups

---

## 3. Model Assignment Reference

### Phase 1 Model Assignments

> [!IMPORTANT]
> **Phase 1 Model Routing Rules:**
> - **Gemini High**: Simple UI fixes, layout adjustments, styling, moving components, adjusting text, small refactors
> - **Claude Sonnet 4.5**: Medium-complex UI restructuring, dashboard redesign, moving Location → Debug, adding clock/greeting/currency defaults, minor logic for UI behavior
> - **Claude Sonnet 4.5 Thinking**: Tasks requiring deeper reasoning or careful architectural awareness without heavy math (reorganizing dashboard structure, deciding rendering order, analyzing component dependencies)

| Task Category | Recommended Model | Reasoning |
|---------------|-------------------|-----------|
| Dashboard summary boxes (UI only) | Gemini High | Simple layout work, no math |
| Clock & greeting display | Claude Sonnet | Minor logic for time-based greetings |
| Location box removal & move to Debug | Claude Sonnet | Requires moving components between pages |
| Currency converter UI defaults | Claude Sonnet | UI wiring with some state management |
| News section layout reorganization | Claude Sonnet | Medium-complex restructuring |
| Pie chart styling | Gemini High | Visual styling only |
| Mobile responsiveness | Claude Sonnet | Requires careful layout consideration |
| Sidebar demo controls | Gemini High | Simple button wiring |
| API branding text removal | Gemini High | Simple text removal |
| Dashboard structure planning | Claude Sonnet Thinking | Architectural decisions about component organization |

### Phase 2 Model Assignments

> [!IMPORTANT]
> **User Priority:** Phase 2 priorities are **transaction data generation, suspicious charge detection algorithms, and math performance**. These should be tackled first.

| Task Category | Recommended Model | Reasoning |
|---------------|-------------------|-----------|
| API rate limiting infrastructure | Claude Opus | Complex logic |
| Transaction date range logic | Claude Opus | Date math, edge cases |
| Recurring/subscription charge detection | Claude Opus | **Deep algorithmic logic** |
| Lifestyle model randomization | Claude Opus | Complex data modeling |
| Merchant pool creation | Claude Thinking | Large data organization |
| VISA vs ACH charge type logic | Claude Opus | Business logic rules |
| Suspicious charge detection (Duplicate) | Claude Opus | **Math-heavy, pattern detection** |
| Suspicious charge detection (Overcharge) | Claude Opus | **Math-heavy, comparison logic** |
| Suspicious charge detection (Unexpected) | Claude Opus | **Math-heavy, anomaly detection** |
| Internal transfer math/netting | Claude Opus | **Financial calculations** |
| Date range debug tool behavior | Claude Opus | Deep state management |
| Fees data generation | Claude Thinking | Data modeling |

### Phase 3 Model Assignments

| Task Category | Recommended Model | Reasoning |
|---------------|-------------------|-----------|
| Design & aesthetic polish | Claude Sonnet | Creative UI work |
| Glassmorphism & under-glow | Claude Sonnet | CSS styling |
| Interaction & UX testing | Gemini High | Test execution |
| Data & math sanity check | Claude Opus | Verification of calculations |
| API performance validation | Claude Thinking | Technical validation |
| Final build verification | Gemini Low | Command execution |

---

## 4. Phase 1 — UI, Layout, Light Behavior

> **Model Guidance:** Primarily use **Gemini Low/High** and **Claude Sonnet** for this phase.  
> Avoid Claude Opus unless encountering unexpected complexity.

### 4.1 Dashboard Introduction & Summary Boxes

**Model: Gemini High**

- [ ] Add a **Dashboard** at the beginning of the experience
  - [ ] At the top of the dashboard, add summary boxes with values like:
    - [ ] **Income** — example value `$68,181.95`
    - [ ] **Spending** — example value `$28,893.26`
    - [ ] **Net Cashflow** — example value `$39,288.69`
    - [ ] **Subscriptions** — example value `$509.65`
    - [ ] **Fees** — example value `$184.75`
  - [ ] These values can come from demo data logic (Phase 2 for exact math), but UI and structure belong here
  - [ ] Style the boxes as premium cards that look good on dark theme and on mobile

### 4.2 Location Box Removal & IP in Debug

**Model: Gemini Low**

- [ ] Remove the entire **"YourLocation" box** wherever it appears
- [ ] Integrate location/IP in different ways:
  - [ ] Add **IP address and location** into the **debug menu**, not on main Overview
  - [ ] Ensure no leftover "YourLocation" text remains in the UI

### 4.3 Clock & Greeting on Dashboard

**Model: Gemini Low**

- [ ] On the Dashboard, use **local time** as a digital clock at the top:
  - [ ] Display time **without seconds**
  - [ ] Include **AM/PM**
  - [ ] Use abbreviated time zone format like **CST, EST, MT, PT**
- [ ] Add greeting logic:
  - [ ] "Good Morning", "Good Afternoon", "Good Evening" based on local time ranges
- [ ] Ensure this clock/greeting combo is responsive and visually clean

### 4.4 Currency Converter UI Defaults & Crypto Conversion UI

**Model: Claude Sonnet**

- [ ] Do **not** create a separate box for "detected currency type"
- [ ] In the **Currency Converter**:
  - [ ] Default the **"From" amount currency** to the **detected currency**
- [ ] Add a **Crypto Currency conversion section**:
  - [ ] Allow converting from **USD or detected currency** to a selected **crypto type**, and vice versa
  - [ ] Default "From" as USD (or detected currency) and "To" as crypto
  - [ ] Add a **swap button** that switches "From" and "To"
  - [ ] Use current exchange rate (wired in Phase 2, but UI should be ready in Phase 1)

### 4.5 Dashboard News & Economic Indicators

**Model: Gemini High**

- [ ] Move **Financial News** to the **Dashboard**
- [ ] Rename section to **"Recent News"**
- [ ] Inside this section, structure news in this order:
  - [ ] Financial
  - [ ] Business
  - [ ] Technology
  - [ ] Stock
  - [ ] Cryptocurrency
- [ ] Add **Economic Indicators** section on Dashboard:
  - [ ] UI with placeholders for indicators (Phase 2 will handle data)
- [ ] Ensure the **Overview page** focuses only on **user's own accounts** and not global news

### 4.6 Overview Page Layout & Pie Chart

**Model: Gemini High**

- [ ] Update the main Overview **pie chart**:
  - [ ] Make it a **full circle** (or equally clear) instead of partial
  - [ ] Ensure readability and premium visual style
- [ ] Keep **5 boxes** on the Overview tab:
  - [ ] Place them **between**:
    - [ ] The group that shows **7 pie chart categories**, and
    - [ ] The **12 transaction categories** shown in the provided image
- [ ] In the transactions section:
  - [ ] Make "Select a category group to see transactions." much **more obvious** when no data is loaded:
    - [ ] Larger font, higher contrast, or dedicated empty-state styling

### 4.7 Remove API Branding Text from UI

**Model: Gemini Low**

- [ ] On any tab where the UI mentions the API explicitly (for example, Overview text like:
  - [ ] "Real-time exchange rates • Free API (no key required)"
- [ ] Remove these informational phrases:
  - [ ] We do not need to advertise API providers or whether they're free in the user UI

### 4.8 Mobile Friendly Layouts

**Model: Claude Sonnet**

- [ ] Ensure the website is **mobile friendly**:
  - [ ] On the Statements page and any table-heavy views:
    - [ ] When text fields/columns are too wide on mobile:
      - [ ] Show only the most important information
      - [ ] Optionally **truncate description names** with ellipsis
      - [ ] Allow the user to **tap the transaction** to open a detailed view/modal with full description
  - [ ] Test other critical pages for responsive layout and adjust as needed

### 4.9 Search / Featured Pages Relevance (UI Layer)

**Model: Gemini High**

- [ ] Wherever there are featured pages or search results:
  - [ ] Implement sorting by a **relevance function**
  - [ ] In Phase 1 this can be basic (e.g., static priority, popularity ranking)
  - [ ] Phase 2 can refine to deeper algorithms if needed

### 4.10 Sidebar Demo Controls

**Model: Gemini High**

- [ ] Add a **"Restart Demo"** button:
  - [ ] Place it at the bottom of the side menu **above** where it says "Demo Mode" in the bottom right
  - [ ] When clicked:
    - [ ] Reset all demo data back to initial state
    - [ ] Bring the user back to the **home screen**
  - [ ] Confirm that all tabs then reflect cleared/regenerated demo data according to Phase 2 logic

---

## 5. Phase 2 — Deep Logic, APIs, Data & Math

> [!WARNING]
> **This phase contains the most complex work.**  
> **Prioritize Claude Opus 4.5** for all math, logic, and algorithm-heavy tasks.

### 5.1 API Infrastructure & Rate Limiting

**Model: Claude Opus**

- [ ] For **all APIs** (exchange rates, stocks, crypto, news, etc.):
  - [ ] Implement a **rate limit or debounce** so users cannot spam-click and waste credits
  - [ ] Ensure this applies to:
    - [ ] Search fields
    - [ ] "Refresh" buttons
    - [ ] Statement regeneration or any action that triggers network calls

- [ ] Debug tool – tokens used:
  - [ ] Add ability in the debug tool to show **API tokens used in the current session** for each API key
  - [ ] Present this via:
    - [ ] A dropdown, button, or popup
    - [ ] Avoid cluttering the main debug panel with token stats

- [ ] Add **rate limiting status** to debug tool:
  - [ ] Show whether each API is:
    - [ ] Within safe limits
    - [ ] Near rate-limit
    - [ ] Temporarily limited

- [ ] Make sure **all required files and code** for the APIs we want to use actually exist:
  - [ ] Even if API keys are missing, the structure and placeholders must be ready
  - [ ] Document where keys should be inserted

---

### 5.2 Statements Tab – Dates, Merchants, and Regeneration

#### 5.2.1 Merchant Images

**Model: Claude Thinking**

- [ ] On the Statements tab, merchant images for merchant logos are not working
  - [ ] Investigate the current image source API or CDN
  - [ ] If you cannot fix it:
    - [ ] Identify exactly **what is needed** (which API, what endpoint, whether a key is required)
    - [ ] Record this in `PLAN.md` so the user can research and provide an API key
  - [ ] Do not silently ignore missing images

#### 5.2.2 Month-by-Month Dropdown & Date Gaps

**Model: Claude Opus**

- [ ] Make the Statements tab able to **drop down month by month**:
  - [ ] Add month/year dropdowns to select a **From** and **To** month/year
  - [ ] Use select inputs, not free-text

- [ ] Fix the **random date jump** problem (e.g., from December 2 to December 22):
  - [ ] Re-examine how transaction dates are generated
  - [ ] Ensure continuous, realistic coverage across the chosen range, unless gaps are intentional (e.g., days with no transactions)

#### 5.2.3 Editing Generated Transaction Date Ranges

**Model: Claude Opus**

- [ ] Allow the user to **edit generated transaction date ranges** (e.g., via debug or UI control):
  - [ ] When the date range is changed:
    - [ ] Regenerate **all transaction date ranges** on all pages (Statements, Overview, Recurring, Subscriptions, etc.)
    - [ ] This change alone does **not** necessarily regenerate data values

  - [ ] When the date range is **extended**:
    - [ ] Add new transactions only for the additional time period
    - [ ] Keep the **same set of random merchants** that were chosen for that generation
    - [ ] Example:
      - [ ] If a generation originally included one insurance provider, then any new transactions falling in the extended dates should use that **same insurance provider**

  - [ ] If the user clicks a **"New Statements"** button:
    - [ ] Treat it as a **full regeneration**:
      - [ ] New lifestyle profile
      - [ ] New merchant set (within the allowed pools)
      - [ ] New transactions

- [ ] Name the full regeneration button something like **"New Statements"**

---

### 5.3 Demo Data Deep Issue – Recurring & Subscription Charges

**Model: Claude Opus**

> [!CAUTION]
> This is identified as a **deep issue** requiring careful algorithmic thinking.

- [ ] There is a deep issue with the **demo fake data**:
  - [ ] Charges for **recurring** or **subscriptions** often do **not** show up properly

- [ ] Correct behavior:
  - [ ] Charges for recurring/subscription merchants should normally:
    - [ ] Come out at the **same amounts** every cycle

  - [ ] There are only two valid cases where amounts differ:
    1. It is a **suspicious charge** (duplicate/overcharge/unexpected – see below)
    2. There is a **separate group of recurring/subscription prices** from the **same merchant** that legitimately occur at different frequencies/amounts
       - [ ] Example:
         - [ ] Apple charges:
           - [ ] $15 on the 12th of each month for iCloud
           - [ ] $9.99 on the 1st of each month for AppleCare
           - [ ] $3.99 every 2 weeks on the 4th and 18th for a weight-loss app
         - [ ] None of these should be suspicious even though the merchant name is `Apple.com`

- [ ] Implement logic so that:
  - [ ] Recurring/subscription amounts are stable, except for legitimate multi-plan setups or flagged suspicious anomalies

---

### 5.4 Lifestyle Model & Merchant Sets (Randomization Logic)

#### 5.4.1 Personal Lifestyle Model per Generation

**Model: Claude Opus**

- [ ] Build a **personal lifestyle model** for each statement generation:
  - [ ] Select a coherent set of **real merchant names** and how they appear on transactions
  - [ ] Use this set consistently across all pages for that generation

- [ ] Rules:
  - [ ] A person typically:
    - [ ] Uses only a small set of grocery stores and fast food spots
    - [ ] Has only **one** mortgage provider
    - [ ] Has 1–3 credit card names (with possible multiple cards per issuer)

  - [ ] Transfers to/from other banks should primarily come from selected **3–5** main accounts
  - [ ] On each regeneration of statements (when not just extending date range):
    - [ ] Recalculate the **personal lifestyle choices**:
      - [ ] Banks
      - [ ] Credit card merchants
      - [ ] Subscription services
    - [ ] Apply this lifestyle to the **My Accounts** page as well

  - [ ] Think of other common personal lifestyle patterns (e.g., ride-share frequency, coffee habits, online shopping) and integrate them into the randomization logic
  - [ ] In real data runs, the number of accounts may vary widely; the logic should adapt but still feel realistic

#### 5.4.2 Target Counts of Merchants Per Generation (Actually Used)

**Model: Claude Thinking**

- [ ] For each generated statement profile, target these **counts of distinct merchants used**:

| Category | Count Range | Notes |
|----------|-------------|-------|
| Streaming services | 2–5 | |
| Music | 1–3 | |
| Cloud storage | 1–3 | |
| Gym | 1–2 | Prioritize 1 |
| Software | 2–6 | Also pick 1–3 random subscriptions (HelloFresh, magazines, etc.) |
| Crypto services/exchanges | 1–3 | |
| Stocks (for portfolio holdings) | 4–10 | |
| Loans | 1–3 | |
| Credit cards | 1–4 | |
| Bank-like accounts | 3–5 | Including PayPal, Cash App, Venmo (P2P except Zelle) |
| → Checking accounts | 1–3 | |
| → Savings accounts | 2–4 | |
| Investment companies (brokerages) | 1–2 | |
| MMSA | 1 | |
| Certificates (CDs) | 1 | |
| Rent or Mortgage | 1 | **Must pick one, not both** |
| Utilities | 2–5 | Electric, gas, water, combined |
| Phone subscriptions | 1–3 | Prioritize 1 |
| Car insurance | 1–2 | Prioritize 1 |
| Life insurance | 1 | |
| Home insurance | 1 | |
| Health insurance | 1 | |
| Rideshare/transport | 1–3 | |
| Food delivery | 1–3 | |
| Gas/Convenience stores | 2–5 | |
| Grocery stores | 2–6 | |
| Restaurants (dine-in) | 4–5 | Use sparingly compared to fast food |
| Fast food | 5–10 | |
| Other food/drink (coffee) | 2–4 | |
| General shopping (non-food) | 3–6 | |
| Online shopping | 3–5 | |
| Unknown/random/other | 4–5 | |
| Credit card issuers | 2–5 | 1–2 dedicated CC companies; fill with bank cards |

#### 5.4.3 Global Pool of Possible Merchants (Selection Universe)

> [!NOTE]
> **User Decision:** Merchant pools should be **hardcoded** (not user-customizable).

**Model: Claude Thinking**

- [ ] Create pools of **possible merchants** for each category, from which per-generation subsets are drawn:

| Category | Pool Size | Example Merchants |
|----------|-----------|-------------------|
| Streaming (TV/Video) | 15 | Netflix, Hulu, HBO Max, Plex, Crunchyroll, YouTube TV, YouTube Premium, Apple TV, etc. |
| Music | 8 | Apple Music, YouTube Music, Spotify, SoundCloud, etc. |
| Cloud storage | 8 | iCloud, Google Drive, Dropbox, OneDrive, etc. |
| Gyms | 15 | Real gym chains |
| Software subscriptions | 20 | Weight loss apps, coding tools, AI subs (ChatGPT, Gemini), music studio software, Adobe suite, etc. Include 1–3 random subscriptions like HelloFresh, magazine subscriptions |
| Crypto assets/exchanges | 8 | XRP, BTC, ETH, etc. |
| Stocks | 50 | Real tickers: TSLA, GOOG, NVDA, etc. |
| Loans | 20 | Bank-based names |
| Banks | 20 | Navy Federal, JP Morgan, Chase, Synchrony Bank, etc. |
| Credit cards | 15 | Combination of banks and dedicated credit card companies |
| Other bank-like / P2P | — | PayPal, Cash App, Venmo, etc. (exclude Zelle) |
| Rent/Mortgage providers | 15 | Real lenders and property managers |
| Utilities | 25 | Electric, gas, water, combined utilities |
| Phone subscriptions | 10 | |
| Car insurance | 10 | |
| Life insurance | 5 | |
| Home insurance | 5 | |
| Health insurance | 5 | Insurance merchants may bundle multiple insurance types |
| Rideshare / transport | 7 | Uber, Lyft, scooters, bikes, rentals, etc. |
| Food delivery | 15 | Grubhub, Instacart, UberEats, DoorDash, pizza delivery, Chick-fil-A delivery, etc. |
| Gas/Convenience stores | 25 | Buc-ee's, Circle K, Cumberland Farms, CEFCO, Valero, Raceway, SUNOCO, Wawa, etc. |
| Grocery stores | 30 | Sam's, Walmart, Target, Whole Foods, Publix, etc. |
| Restaurants (dine-in) | 25 | From Waffle House to LongHorn Steakhouse, local chains, etc. |
| Fast food | 30 | Real, recognizable names |
| Other food/drink (coffee) | 15 | Starbucks, Dunkin, local cafés, etc. |
| Shopping stores (non-food) | — | Best Buy, Lowe's, Home Depot, hardware stores, World Market, Earthbound, antique shops, Ollie's, etc. |
| Online shopping | — | Etsy, StockX, Amazon, eBay, Walmart.com, BestBuy.com, Target.com, AliExpress, Temu, TikTok Shop, online jewelers, Fashion Nova, generic "online shopping" |
| Unknown/random/other | 4–5 | Street vendors, gift shops, generic names or messy descriptors |
| Checking accounts | 1–3 | Real bank names |
| Savings | 2–4 | Real bank names |
| Investment companies | 1–2 | Vanguard, Fidelity, etc. |
| MMSA & Certificates | — | Use real bank names. Label accounts as Savings, Checking, MMSA, Certificate appropriately |
| Other one-off merchants | — | Mechanic shop, dealership, DMV, etc. |
| Credit cards (extended pool) | 20 | At least 5 dedicated credit card companies. Fill the rest with cards issued by banks already present. Include store cards (Lowe's, Amazon store card, etc.) |

#### 5.4.4 Charge Type Logic (VISA vs ACH)

**Model: Claude Opus**

- [ ] Use **VISA** as the main type of debit/credit card charge
- [ ] Build logic to determine which merchants typically charge via:
  - [ ] **ACH** (using routing/account numbers, like some utilities, loans, mortgages)
  - [ ] **VISA** card transactions (in-person and online)

- [ ] Many merchants (e.g., Lowe's, Lowe's CC, PayPal, Cash App, Venmo) may accept both:
  - [ ] Group these into a category where they can be either ACH or VISA depending on context

- [ ] Display rules:
  - [ ] All debit card purchases done **in person** should be labeled like `VISA*MERCHANTNAME`
  - [ ] Merchants that also allow online orders should be able to show up as:
    - [ ] The website name (e.g., "LOWES.COM") or
    - [ ] `VISA*MerchantName`

- [ ] For each merchant you research or define:
  - [ ] Categorize its typical display pattern and charge type
  - [ ] Make sure the patterns feel legitimate

#### 5.4.5 Transaction Frequency & Descriptions

**Model: Claude Thinking**

- [ ] Adjust the **frequency of transactions**:
  - [ ] Account for increased number of merchants and categories
  - [ ] Keep volumes realistic for a normal person (avoid over-cluttered statements)

- [ ] After each merchant name, add a descriptor **when appropriate**:
  - [ ] Example: "Gas", "Food subscription", "Magazine", "Transfer", "Add money", "Loan payment"
  - [ ] Do **not** add descriptors when the merchant name alone clearly implies the purchase (e.g., McDonald's, Netflix), unless that merchant typically uses extra descriptor text on real statements

- [ ] For each merchant:
  - [ ] Decide whether charges usually include additional descriptors
  - [ ] Categorize merchants into logic categories so their descriptions follow consistent rules

#### 5.4.6 Category Reorganization

**Model: Gemini High**

- [ ] Reorganize category logic:
  - [ ] Replace the **Education** category with **Online Shopping**
  - [ ] Change **Groceries** category to a more general **Stores** if that better fits all store merchants
  - [ ] Merchants like IKEA, Walmart, Home Depot, Lowe's should be categorized appropriately (not all thrown into "Other")

---

### 5.5 Fees Data Generation

**Model: Claude Thinking**

- [ ] For **fees** data:
  - [ ] Generate realistic fake fees such as:
    - [ ] ATM fee with the bank name
    - [ ] Monthly bank account fees
    - [ ] Overdraft fees
    - [ ] Late payment fees
  - [ ] Use descriptors like "ATM Fee" or "Late payment" followed by which bank or merchant charged it

- [ ] Per generation:
  - [ ] Show **3–6 fee merchants** actually used
  - [ ] Have a **pool of ~12 possible fee merchants/types** to choose from
  - [ ] Ensure names are realistic and match the bank/merchant patterns

---

### 5.6 Subscriptions & Recurring Pages – Suspicious Logic (Deep Issue)

> [!CAUTION]
> **This is a deep, math-heavy section. Use Claude Opus 4.5 exclusively.**

#### 5.6.1 Subscriptions Page UX and Grouping

**Model: Claude Sonnet** (UX parts), **Claude Opus** (logic parts)

- [ ] On **Subscriptions page**:
  - [ ] Make "Possible duplicate subscriptions detected: 0" (or any count) **much more prominent** to encourage clicks
  - [ ] Fix the **"Show details"** button:
    - [ ] Currently only works on Recurring page, not on Subscriptions
    - [ ] Make it work on Subscriptions as well

- [ ] Reorganize transaction display:
  - [ ] Group each **merchant by category**
  - [ ] Allow users to **expand** a merchant to see:
    - [ ] List of charges
    - [ ] Prices
    - [ ] Dates
    - [ ] Which charges are flagged as suspicious

- [ ] Change the yellow box title text to:
  - [ ] **"Suspicious Charges Detected"**

#### 5.6.2 Number of Suspicious Merchants

**Model: Claude Opus**

- [ ] Suspicious charges logic must:
  - [ ] Load and operate correctly with **fake data**
  - [ ] Detect suspicious charges from **multiple merchants**:
    - [ ] At least **3 different merchants**, ideally **2–6**
    - [ ] If there are 3 or more suspicious merchants, ensure you see **each type of suspicious pattern** present (duplicate, overcharge, unexpected)

#### 5.6.3 Suspicious Charge Types

**Model: Claude Opus**

> [!IMPORTANT]
> **Implement three suspicious charge types exactly as described:**

##### 1. Duplicate Charge

- [ ] Definition:
  - [ ] 2 or more charges of the **same amount** from the same merchant, **outside its normal frequency pattern**
  - [ ] Use a **3-day forgiveness range** when comparing due dates

- [ ] Examples to encode:
  - [ ] **Example A (Suspicious):**
    - Apple charge $10 on Nov 1
    - Apple charge $10 on Nov 12
    - Normal pattern: every 30 days
    - This is a pattern anomaly → **suspicious**

  - [ ] **Example B (Not Suspicious – weekday forgiveness):**
    - Apple charge $10 on Nov 1
    - Apple charge $10 on Nov 3
    - Normal pattern: monthly, but billing may happen only on weekdays
    - Within a 3-day forgiveness, this is **not suspicious**

  - [ ] **Example C (Pattern check with slightly different amounts):**
    - Apple charge $10 on Nov 1
    - Apple charge $8.50 on Nov 15
    - Normal monthly pattern, but multiple Apple services could be billed in the same month
    - Check for other Apple charges around (+/-3 days) in previous or next month:
      - [ ] If similar charges appear around that date in adjacent months → **not suspicious**
      - [ ] If a similar charge only appears 4+ months apart → may be **suspicious**
      - [ ] If the charge recurs more than **3 times in 5 months**, treat as **normal recurring**, unless a new charge appears that is 5+ months away from the last one (then suspicious)

- [ ] Implement logic that:
  - [ ] Tracks normal frequency and flags anomalies accordingly

##### 2. Overcharge

- [ ] Definition:
  - [ ] A charge from a known recurring/subscription merchant that:
    - [ ] Falls within the **expected date window** (+/-3 days), but
    - [ ] Is **higher than the expected normal amount**

- [ ] Behavior:
  - [ ] If this is the **only** charge in that date window:
    - [ ] Mark as **overcharge**

  - [ ] If there are **multiple charges** in that date window:
    - [ ] Check whether the normal expected amount was also charged
    - [ ] If yes, see if the higher amount belongs to an **unexpected** one-off purchase (see next type)

##### 3. Unexpected Charge

- [ ] Definition:
  - [ ] A charge from a known subscription/recurring merchant where:
    - [ ] The amount **does not match** typical amounts for that merchant
    - [ ] That specific amount:
      - [ ] Has not appeared in the month before or after
      - [ ] Has not appeared within the last **3 months** before or ahead

- [ ] This is a true anomaly and may be:
  - [ ] Fraud
  - [ ] Some extra one-time purchase

- [ ] Amount grace:
  - [ ] If an amount is within **$0.10** of the standard value, treat it as the **same** amount (not suspicious)

#### 5.6.4 Suspicious Charge Details UI

**Model: Claude Sonnet**

- [ ] For both Subscriptions and Recurring pages, under "Show details of possible duplicate charges":
  - [ ] Add a button like **"More info"**
  - [ ] When clicked:
    - [ ] Show the suspicious charge plus **all nearby charges** from that merchant (regardless of amount)
    - [ ] Provide a **short explanation** for why each flagged charge is suspicious:
      - [ ] Duplicate
      - [ ] Overcharge
      - [ ] Unexpected
    - [ ] If multiple suspicious charges share the same merchant block, mark them all clearly

- [ ] Add action buttons:
  - [ ] **Red "Mark suspicious"**
  - [ ] **Green "All good"**
  - [ ] Map these logically to existing confirm/dismiss buttons:
    - [ ] Green = "Confirm OK"
    - [ ] Red = "Confirm suspicious"

- [ ] Change the **first orange button** under "Possible duplicate charges detected":
  - [ ] From "Show details" to something like **"Review now"** to make the call to action stronger

- [ ] Make the **purple background box** on this page **about 50% more transparent**

---

### 5.7 Editing Transactions & Suspicious Counts

**Model: Claude Opus**

- [ ] When all suspicious charges are marked as reviewed (e.g., UI states "All suspicious charges reviewed"):
  - [ ] Provide an **edit/pencil icon** that lets the user:
    - [ ] Edit transactions
    - [ ] Change their categories

- [ ] Ensure:
  - [ ] Changes to a transaction's category or suspicious status:
    - [ ] Actually modify the underlying data
    - [ ] Update the counts of suspicious charges:
      - [ ] In the popup
      - [ ] On the Review tab's summary box

---

### 5.8 Date Range Logic & Debug Tool Behavior

**Model: Claude Opus**

- [ ] Fix the **date range function in the debug tool**:
  - [ ] It should represent the **date range the entire website is using for data**, not just what is currently being viewed
  - [ ] This is a **deep issue**

- [ ] Currently:
  - [ ] The statements tab allows any date to be chosen, but it always shows basically **December 2 – December 16**

- [ ] Correct behavior:
  - [ ] Reanalyze date logic so the **current date** becomes the default **statement end date**, unless overridden
  - [ ] The debug tool should be able to change the **stored** date range for the active dataset

- [ ] Distinguish two roles:
  - [ ] **Statements page date dropdown**:
    - [ ] Changes what is **viewed**
  - [ ] **Debug tool date range control**:
    - [ ] Changes what is **stored** and regenerates/rewrites data as necessary

  - [ ] There should be **no visible difference** except:
    - [ ] One is clearing/regenerating data (debug)
    - [ ] One is just filtering what's displayed (statements selector)

- [ ] Remove **"Active test tab"** from the debug tool

---

### 5.9 Math Logic & Internal Transfers

**Model: Claude Opus**

> [!IMPORTANT]
> **This requires deep financial calculation logic.**

- [ ] Change **all math logic** wherever totals are computed, such that:
  - [ ] Internal transfers are handled as **net** values:
    - [ ] Money sent vs. money received

  - [ ] Transfers should **not** inflate deposits, credits, debits, or spending

- [ ] Apply this rule to:
  - [ ] Net portfolio calculations
  - [ ] Total money spent
  - [ ] Money left after bills
  - [ ] Income/deposits

- [ ] Think through each metric:
  - [ ] Decide explicitly whether transfers should:
    - [ ] Be excluded from totals
    - [ ] Be shown separately
    - [ ] Be netted

- [ ] You may create a **dedicated math folder**:
  - [ ] Centralize category math, transfer netting functions, and date-range calculations
  - [ ] Ensure all pages use this shared logic

---

### 5.10 My Accounts Page (Previously "Accounts")

**Model: Claude Thinking** (structure), **Claude Opus** (calculations)

- [ ] Rename **Accounts** page to **"My Accounts"** in UI and routing (where appropriate)
- [ ] Allow editing of **default preloaded accounts**:
  - [ ] Edit account **name**
  - [ ] Edit **category/type** (Checking, Savings, MMSA, Roth, Loan, Credit Card, Mortgage, Auto Loan, etc.)
  - [ ] Edit **balance** and the **balance date range** or assumptions

- [ ] Group accounts by **asset type**:
  - [ ] Checking
  - [ ] Savings
  - [ ] MMSA
  - [ ] Roth / retirement
  - [ ] Loan
  - [ ] Credit Card
  - [ ] Mortgage
  - [ ] Auto loan
  - [ ] (Crypto and stocks should remain on separate dedicated pages, but still factor into net worth)

- [ ] Add two summary boxes under the main My Accounts section:
  - [ ] **Total stock investment portfolio (net)**
  - [ ] **Total crypto investment portfolio (net)**

- [ ] Implement **Net Worth History**:
  - [ ] Show a neatly formatted graph
  - [ ] Allow selectable time frames (e.g., 1M, 3M, 6M, 1Y)
  - [ ] Underneath, list all accounts with:
    - [ ] A circle toggle switch (on/off) per account
    - [ ] When toggled off, the account is excluded from net worth calculations
  - [ ] Stocks and crypto must also appear in net worth history toggles

- [ ] Clicking on the **stock** or **crypto** summary boxes:
  - [ ] Should redirect to their respective detailed pages

- [ ] Provide an **account list editor**:
  - [ ] Use dropdown arrows to expand groups with descriptions
  - [ ] Add a **Select/Deselect All** control at the bottom

- [ ] Add a **Savings Goal Calculator**:
  - [ ] Fully implement savings goal functions at the bottom of the My Accounts page
  - [ ] When a savings goal is selected:
    - [ ] Show a **progress bar** between "Balance by account type" and "All accounts"
    - [ ] The bar should display:
      - [ ] Progress toward goal
      - [ ] "On track" or "Off track" status based on current date and contributions

  - [ ] When no savings goal is set up:
    - [ ] Show an empty bar and a "Set up savings goal" button
    - [ ] Clicking the button automatically scrolls down to the goal setup area

  - [ ] Keep "Coming soon" text at the very bottom only if needed to hint at future features

- [ ] For connecting external accounts:
  - [ ] Take the **purple "Connect your account"** element from the Review page
  - [ ] Replace the "Connect your bank box" on My Accounts with this purple element
  - [ ] When clicked:
    - [ ] Show a popup with an X in top-right
    - [ ] Text like: "Coming soon – connect with Plaid."
  - [ ] Place this connect box directly **under My Accounts summary**
  - [ ] **Note:** Plaid integration is NOT part of this phase - keep as "Coming soon" only

- [ ] Internal transfers list:
  - [ ] The detailed list of all transfers (described in Internal Transfers section) should ultimately live on My Accounts, even if triggered from Review

---

### 5.11 Stocks Page – Behavior & Data

#### 5.11.1 Holdings Card Overlay Issue

**Model: Gemini High**

- [ ] On the Stocks page, when hovering over a holding:
  - [ ] A trash can icon appears to delete that holding
  - [ ] Currently, it is displayed **on top of the stock price**
  - [ ] Adjust layout so the icon and price do not overlap

#### 5.11.2 Stocks Search & Relevance

**Model: Claude Thinking**

- [ ] Stocks search bar:
  - [ ] When the search popup is opened:
    - [ ] It should open as soon as the user clicks into it (not only after typing)
    - [ ] Even with no text typed, it should show **relevant** suggestions:
      - [ ] Popular stocks
      - [ ] Best performers
      - [ ] Recent user holdings (if appropriate)

  - [ ] When the user types:
    - [ ] Continue to show matches sorted by relevance

- [ ] Add a **"Browse all"** button:
  - [ ] Opens a view that shows recommended or popular stocks
  - [ ] Group them by category (e.g., Tech, Blue Chips, ETFs)

- [ ] Data constraints:
  - [ ] Ideally, there is a **database of all stocks/ETFs** accessible
  - [ ] If not, implement a **very generous cap** of realistic tickers

#### 5.11.3 Add-to-Portfolio Form

**Model: Claude Sonnet**

- [ ] When adding a stock to portfolio (via search or an "Add" button):
  - [ ] In the **Average Cost Per Share** field:
    - [ ] Prepend or show a **$** sign

  - [ ] Add a **custom date purchased** field with an info bubble:
    - [ ] Info bubble text: explains that the date helps track net worth history

- [ ] Before saving the stock:
  - [ ] Provide a button to **add multiple purchase lots**:
    - [ ] Each additional lot has:
      - [ ] Share quantity
      - [ ] Price per share
      - [ ] Purchase date
    - [ ] Users can click to add new rows as many times as they need

#### 5.11.4 Stock Detail Data

**Model: Claude Thinking**

- [ ] Stock detail section must include rich data similar to:
  - [ ] NVIDIA Corporation (NVDA)
  - [ ] Price 183.38
  - [ ] +$3.79
  - [ ] +(2.11%)
  - [ ] At close: 4:00:00 PM EST
  - [ ] $184.16
  - [ ] +$0.78
  - [ ] (+0.43%)
  - [ ] Overnight: 11:49:08 PM EST
  - [ ] Previous Close $179.59
  - [ ] Open $181.57
  - [ ] Bid $182.63 x 100
  - [ ] Ask $183.27 x 100
  - [ ] Day's Range $179.97 - 184.51
  - [ ] 52 Week Range 86.62 - 212.19
  - [ ] Volume 166,479,246
  - [ ] Avg. Volume 191,223,562
  - [ ] Market Cap (intraday) 4.465T
  - [ ] Beta (5Y Monthly) 2.27
  - [ ] PE Ratio (TTM) 45.39
  - [ ] EPS (TTM) 4.04
  - [ ] Earnings Date Nov 19, 2025
  - [ ] Forward Dividend & Yield 0.04 (0.02%)
  - [ ] Ex-Dividend Date Dec 4, 2025
  - [ ] 1y Target Est 250.66

- [ ] Add `$` signs where appropriate and clean numeric formatting
- [ ] Add a link to **Motley Fool** article if available:
  - [ ] Display it at the top of the news suggestions under that stock

#### 5.11.5 Stock Comparison Feature

**Model: Claude Thinking**

- [ ] Add a **"Compare stocks"** feature:
  - [ ] Button or clearly visible entry point
  - [ ] Allow users to select up to **three stocks**
  - [ ] Show a comparison table similar to the provided screenshot:
    - [ ] Market value
    - [ ] Enterprise value
    - [ ] Price to earnings
    - [ ] Diluted EPS
    - [ ] Forward dividend & yield
    - [ ] Sector, industry, CEO, etc.
    - [ ] Price performance for 1 Week, 3 Months, YTD, 1 Year
    - [ ] Income statement basics
    - [ ] Balance sheet basics

- [ ] Overnight prices:
  - [ ] Show overnight price separately and clearly labeled as such
  - [ ] Create a new ticker tab or view that shows only overnight price movements

#### 5.11.6 Watchlist

**Model: Claude Sonnet**

- [ ] Implement a **Watchlist**:
  - [ ] Provide a button to add:
    - [ ] Any stock
    - [ ] Any news article

  - [ ] Maintain **separate lists** for:
    - [ ] Watched stocks
    - [ ] Watched news/articles

  - [ ] Ensure the library of watchable stocks is expanded via:
    - [ ] Search
    - [ ] "Browse all" view

---

### 5.12 Crypto Page – Mirroring Stocks with Crypto Data

**Model: Claude Opus**

- [ ] Main problem: **no crypto information displayed**
  - [ ] Investigate current crypto API (likely CoinGecko)
  - [ ] Determine if:
    - [ ] The endpoint is broken
    - [ ] A key is now required

  - [ ] If necessary, note which key is needed so the user can supply it
  - [ ] If CoinGecko is too difficult, consider **Yahoo Finance** or another reliable source for crypto pricing and details

- [ ] Apply all **Stocks page improvements** analogously to the **Crypto page**, using crypto-appropriate data:
  - [ ] Rich detail per coin (price, 24h change, market cap, volume, etc.)
  - [ ] Search + browse with relevance
  - [ ] Add-to-portfolio with buy lots and dates
  - [ ] Crypto watchlist

- [ ] At the **bottom of the Crypto page**:
  - [ ] Add the **Currency ↔ Crypto exchange** box:
    - [ ] Show current estimated exchange rates
    - [ ] Show any fees or percentage spreads
    - [ ] Allow converting both ways and swapping "From"/"To"

---

### 5.13 Review Tab – Logic, Layout, and Color

#### 5.13.1 Detected Accounts Relocation

**Model: Gemini High**

- [ ] Move the **Detected Accounts** UI from Review tab to My Accounts:
  - [ ] Place under "My Accounts" box on the My Accounts page

#### 5.13.2 Account Balances Box

**Model: Claude Opus**

- [ ] On Review tab:
  - [ ] Remove "Coming soon" in the **Account balances** box
  - [ ] Use actual data from:
    - [ ] Generated statements
    - [ ] My Accounts page

  - [ ] Show:
    - [ ] Checking
    - [ ] Savings
    - [ ] Investments (Crypto & Stock)
    - [ ] Debt:
      - [ ] Hide actual number by default
      - [ ] Show as `XXXX.XX` until an eye icon is clicked to reveal

- [ ] At the bottom of the account balances box:
  - [ ] Add text: **"Avg daily spending"** with the calculated value

- [ ] When a user clicks "Review" on Detected Accounts and selects **"Add account"**:
  - [ ] Ensure it:
    - [ ] Adds the account to the account balances section on Review
    - [ ] Adds the account to the accounts list on My Accounts

#### 5.13.3 Overall Review Layout & Color

**Model: Claude Sonnet**

- [ ] At the top of Review:
  - [ ] Increase the font size for text inside all **six boxes** so they're easier to read

- [ ] Make each box section visually interesting:
  - [ ] Add tasteful effects, colors, or subtle animations

- [ ] Tab color:
  - [ ] The Review tab should be **deep purple, glassy**, matching the site's theme
  - [ ] All tabs should have **good, popping colors** distinct from each other
  - [ ] Review tab should no longer be plain white

#### 5.13.4 Subscriptions Box in Review

**Model: Claude Sonnet**

- [ ] In the **Subscriptions** box on Review tab:
  - [ ] "Tap to manage subscriptions" currently does nothing:
    - [ ] Make it open a popup
    - [ ] Popup shows all subscription merchants separated into **expandable/collapsible** sections:
      - [ ] One section per merchant
      - [ ] Include all merchants, even if suspicious

  - [ ] In this popup:
    - [ ] If any merchant has suspicious charges:
      - [ ] Place a `!` triangle next to the merchant's header
      - [ ] Also place `!` next to each specific suspicious transaction line

#### 5.13.5 Suspicious Charges Box (Renaming Duplicate Charges)

**Model: Claude Sonnet**

- [ ] Rename "Duplicate charges" summary box on Review to **"Suspicious charges"**
- [ ] Replace text "with possible duplicates" with a more accurate description that covers:
  - [ ] Duplicate charges
  - [ ] Overcharges
  - [ ] Unexpected charges

- [ ] When user opens suspicious charges to review and clicks **dismiss**:
  - [ ] Ensure it:
    - [ ] Updates the number displayed in the popup
    - [ ] Updates the number in the Review page box

#### 5.13.6 Money Left After Bills

**Model: Claude Opus**

- [ ] "Money left after bills" box:
  - [ ] Display **Average monthly money left after bills**

- [ ] On click:
  - [ ] Show a modal or popup with:
    - [ ] A **histogram bar graph** of **month-by-month money left after bills**
    - [ ] Editable view (e.g., different date ranges)
    - [ ] At top: the average monthly amount
    - [ ] Below: the **total money left** over the current selected/edited date range (based on statements tab date range)

- [ ] Add a description explaining:
  - [ ] What is and isn't included, e.g.:
    - [ ] IRAs? Crypto? Investments?
    - [ ] These should **not** be included as "savings" by default
    - [ ] Net transfers should be considered properly

- [ ] Provide toggles (circle selectors) to:
  - [ ] Optionally include or exclude:
    - [ ] Crypto
    - [ ] Investments
    - [ ] Other categories

  - [ ] Including/excluding should update:
    - [ ] The popup totals
    - [ ] The main Review box value

#### 5.13.7 Internal Transfers Box

**Model: Claude Opus**

- [ ] Internal transfers box should:
  - [ ] Show **Total money sent out**
  - [ ] Show **Total money received**
  - [ ] Show **Net amount**
  - [ ] Display **number of transfers**
  - [ ] Display current date range in small gray text, always derived from:
    - [ ] Default statement range or
    - [ ] User-chosen statements date range

- [ ] When clicking the internal transfers box:
  - [ ] Show list of all transfers organized as:
    - [ ] Expandable month-by-month sections

- [ ] This detailed internal transfers list should eventually appear on My Accounts page as well

#### 5.13.8 Needs vs Wants

**Model: Claude Opus**

- [ ] Needs vs Wants section:
  - [ ] Ensure that all updated math, transfer netting, and category assignments:
    - [ ] Feed into Needs vs Wants logic

  - [ ] When it says "Saved this month", confirm:
    - [ ] It uses correct logic consistent with:
      - [ ] Internal transfer netting
      - [ ] Income/spending categories

---

### 5.14 Popups & Under-Glow Effects

**Model: Claude Sonnet**

- [ ] For all popup screens that appear when clicking special buttons:
  - [ ] Add a slight **under-glow** behind the black glass background
  - [ ] The glow color should match the **current page/tab color**
  - [ ] Keep it subtle:
    - [ ] Not super bloomy
    - [ ] More like a neon glow line around edges, or soft halo

  - [ ] In Phase 2, set up structure/classes
  - [ ] In Phase 3, tune the exact look

---

## 6. Phase 3 — Final Polish & QA

> **Model Guidance:** Mix of Sonnet for UI work, Opus for verification of calculations.

### 6.1 Design & Aesthetic Polish

**Model: Claude Sonnet**

- [ ] Review **every tab** for:
  - [ ] Consistent color palette
  - [ ] Glassmorphism and under-glow usage
  - [ ] Premium, non-bland, non-cartoonish look

- [ ] Refine:
  - [ ] Dashboard summary cards
  - [ ] Overview pie chart styling
  - [ ] Review tab boxes and headings
  - [ ] My Accounts net worth graph and savings goal bar
  - [ ] Popup designs and transitions

### 6.2 Interaction & UX Testing

**Model: Gemini High**

- [ ] On **every page**, test:
  - [ ] Clicks
  - [ ] Opens
  - [ ] Scroll behavior (especially on mobile)
  - [ ] Drag interactions
  - [ ] Hover states
  - [ ] Keyboard focus where appropriate

- [ ] Confirm:
  - [ ] All buttons open the correct popups
  - [ ] All X/close icons work
  - [ ] "Restart Demo" resets data and routing as expected
  - [ ] "Manage subscriptions", "Review now", "More info", "Mark suspicious", "All good", etc. perform correctly

### 6.3 Data & Math Sanity Check

**Model: Claude Opus**

- [ ] Validate across the entire app:
  - [ ] Totals for spending, income, and net cashflow match underlying transactions, with transfers netted correctly
  - [ ] Money left after bills reflects:
    - [ ] Correct date range from Statements
    - [ ] Inclusion/exclusion toggles (crypto, investments)
  - [ ] Suspicious charges counts:
    - [ ] Match the actual number of flagged transactions across pages

  - [ ] Needs vs Wants:
    - [ ] Shows consistent savings logic and monthly "Saved this month" values

- [ ] Check that:
  - [ ] Account balances in My Accounts, Review, and Dashboard align
  - [ ] Stock and crypto holdings feed properly into:
    - [ ] Net worth history
    - [ ] Investment totals

### 6.4 APIs & Performance

**Model: Claude Thinking**

- [ ] Confirm all APIs:
  - [ ] Respect implemented rate limits/debounces
  - [ ] Are not being spammed by unnecessary calls (especially search)
  - [ ] Fail gracefully when keys are missing (show user-friendly messages)

- [ ] Debug tool:
  - [ ] Token counts per API per session display correctly
  - [ ] Rate limit status is accurate

- [ ] Performance:
  - [ ] Page loads remain responsive
  - [ ] Heavy lists (statements, transactions) handle virtualization or pagination as needed

### 6.5 Final Build & Documentation

**Model: Gemini Low**

- [ ] Run final commands:
  - [ ] `npm run lint` (ensure clean)
  - [ ] `npm run dev` smoke test for manual clicking around
  - [ ] `npm run build` for final verification

- [ ] Update `PLAN.md`:
  - [ ] Check off completed items
  - [ ] Note any remaining issues that require user action (e.g., missing API keys, external service changes)
  - [ ] Document any known edge cases or future improvement ideas

---

## 7. API Integration Details

> **Source:** `APIS_INTEGRATED.md` (567 lines)  
> **Last Updated:** December 4, 2025

### 7.1 API Summary Table

| API | Purpose | Rate Limit | Key Required | Status |
|-----|---------|------------|--------------|--------|
| CoinGecko | Crypto prices/data | 30 calls/min | Yes (optional) | ✅ Active |
| CoinMarketCap | Crypto backup | 333 calls/day | Yes | ✅ Active |
| Yahoo Finance | Stock data | ~2000/hour | No | ✅ Active |
| Frankfurter | Currency exchange (primary) | Unlimited | No | ✅ Active |
| ExchangeRate-API | Currency exchange (backup) | 1,500/month | No | ✅ Active |
| ipapi.co | Location detection | 1,000/day | No | ✅ Active |
| Clearbit Logo | Merchant logos | Unlimited | No | ✅ Active |
| FRED | Economic data | Unlimited | Demo key | ✅ Active |
| News API | Financial news | 100/day | Yes | ✅ Active |
| WorldTimeAPI | Timezone data | Unlimited | No | ✅ Active |
| QuickChart | Chart images | Unlimited | No | ✅ Active |
| UUIDTools | UUID generation | Unlimited | No | ✅ Active |
| Faker API | Demo data | Unlimited | No | ✅ Active |
| Random User | Profile photos | Unlimited | No | ✅ Active |
| REST Countries | Country/currency data | Unlimited | No | ✅ Active |
| Abstract Email | Email verification | 100/month | Yes | ✅ Active |
| OCR.space | Receipt scanning | 500/month | Optional | 🔜 Future |

### 7.2 API Keys Available

> [!CAUTION]
> **Store these keys securely in environment variables. Never expose in client-side code.**

```env
# CoinGecko (Primary Crypto) - 30 calls/min with key
COINGECKO_API_KEY=CG-6BZouhuMK3pj4Q2HxH4jZgab

# CoinMarketCap (Crypto Backup) - 333 calls/day
COINMARKETCAP_API_KEY=e1f0879635dc4b7da3bfda68cebf2858

# News API - 100 calls/day
NEWS_API_KEY=b04754f709c4439ea8e1a4a280c737cc

# Abstract Email Verification - 100/month
ABSTRACT_EMAIL_API_KEY=c06de9698fc14b549cc7ceea8ad2e6d1
```

### 7.3 Critical Rate Limit Constraints & Debounce Rules

> [!WARNING]
> **High-Risk APIs (Low Daily Limits):**
> - **News API:** Only 100 calls/day - cache aggressively (30 min TTL), debounce search by 500ms
> - **Abstract Email:** Only 100 calls/month - cache forever once validated (30 days TTL)
> - **CoinMarketCap:** 333 calls/day - use only as fallback for CoinGecko
> - **ipapi.co:** 1,000 calls/day - cache for 24 hours
> - **ExchangeRate-API:** 1,500 calls/month (~50/day) - use only as fallback, cache 6 hours

**Debounce/Rate Limiting Rules:**
- Search fields: 300-500ms debounce before API call
- Refresh buttons: Minimum 1-second cooldown between clicks
- Statement regeneration: Minimum 2-second cooldown
- All API calls: Check cache first, implement exponential backoff on failures

### 7.4 Finance & Market APIs (Detailed)

#### 7.4.1 CoinGecko (Primary Crypto)

**Endpoint:** `https://api.coingecko.com/api/v3`

**Rate Limits:**
- Without key: 10-50 calls/min
- With key: 30 calls/min (demo tier)

**Caching Strategy:**
- Live prices: 1 minute TTL
- Chart data: 5-60 minutes based on timeframe
- Trending: 15 minutes TTL

**Key Endpoints:**
```javascript
// Search cryptos
GET /search?query={query}

// Get prices for multiple coins
GET /coins/markets?vs_currency=usd&ids={ids}&price_change_percentage=7d,30d,1y

// Get detailed coin data
GET /coins/{id}?localization=false&tickers=false

// Get chart data
GET /coins/{id}/market_chart?vs_currency=usd&days={days}

// Get trending
GET /search/trending

// With API key (append to URL)
&x_cg_demo_api_key=CG-6BZouhuMK3pj4Q2HxH4jZgab
```

#### 7.4.2 CoinMarketCap (Crypto Backup)

**Endpoint:** `https://pro-api.coinmarketcap.com/v1`

**Rate Limits:** 333 calls/day (Basic tier)

**Caching Strategy:** Only use when CoinGecko fails or rate limited, cache for 5 minutes minimum

**Key Endpoints:**
```javascript
// Headers required
Headers: { 'X-CMC_PRO_API_KEY': 'e1f0879635dc4b7da3bfda68cebf2858' }

// Get quotes
GET /cryptocurrency/quotes/latest?symbol={symbols}

// Get trending
GET /cryptocurrency/trending/latest

// Get new listings
GET /cryptocurrency/listings/latest?sort=date_added&limit=20
```

#### 7.4.3 Yahoo Finance (Stocks)

**Library:** `yahoo-finance2` v3

**Rate Limits:** ~2000 calls/hour (unofficial, be polite)

**Caching Strategy:**
- Quotes: 1 minute TTL
- Charts: 5-60 minutes based on timeframe
- News: 30 minutes TTL
- Company info: 24 hours TTL

**Key Methods:**
```javascript
import YahooFinance from 'yahoo-finance2';
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Get quote
await yf.quote('AAPL');

// Search stocks
await yf.search('Apple', { quotesCount: 15 });

// Get chart data
await yf.chart('AAPL', { period1: '2024-01-01', interval: '1d' });

// Get insights (analyst recommendations)
await yf.insights('AAPL');

// Get trending
await yf.trendingSymbols('US', { count: 25 });
```

#### 7.4.4 FRED (Economic Data)

**Endpoint:** `https://api.stlouisfed.org/fred`

**Rate Limits:** Unlimited (with API key)

**Caching Strategy:** 30 minutes TTL (data updates slowly)

**API Key:** `demo` works for basic access

**Key Series IDs:**
```javascript
// Get economic series data
GET /series/observations?series_id={id}&api_key=demo&file_type=json

// Series IDs we use:
// FEDFUNDS - Federal Funds Rate
// CPIAUCSL - Consumer Price Index (Inflation)
// UNRATE - Unemployment Rate
// GDP - Gross Domestic Product
// DGS10 - 10-Year Treasury Rate
```

### 7.5 Currency & Exchange APIs

#### 7.5.1 Frankfurter (Primary Exchange)

**Endpoint:** `https://api.frankfurter.app`

**Rate Limits:** Unlimited (be polite)

**Caching Strategy:** 6 hours TTL (rates don't change fast)

**Key Endpoints:**
```javascript
// Get latest rates
GET /latest?from=USD

// Get specific currencies
GET /latest?from=USD&to=EUR,GBP,JPY

// Historical rates
GET /{date}?from=USD&to=EUR

// Convert amount
GET /latest?amount=100&from=USD&to=EUR
```

#### 7.5.2 ExchangeRate-API (Backup Exchange)

**Endpoint:** `https://api.exchangerate-api.com/v4`

**Rate Limits:** 1,500/month (no key)

**Caching Strategy:** 6 hours TTL, only use as fallback

**Key Endpoints:**
```javascript
// Get all rates for base currency
GET /latest/{base}
// Example: /latest/USD
```

### 7.6 Location & Geo APIs

#### 7.6.1 ipapi.co (Location Detection)

**Endpoint:** `https://ipapi.co/json/`

**Rate Limits:** 1,000/day (no key)

**Caching Strategy:** 24 hours TTL (location rarely changes)

**Response Fields Used:**
```javascript
{
  city: "Baltimore",
  region: "Maryland",
  country_name: "United States",
  country_code: "US",
  latitude: 39.2904,
  longitude: -76.6122,
  timezone: "America/New_York",
  currency: "USD",
  ip: "xxx.xxx.xxx.xxx"
}
```

#### 7.6.2 REST Countries

**Endpoint:** `https://restcountries.com/v3.1`

**Rate Limits:** Unlimited

**Caching Strategy:** 7 days TTL (rarely changes)

**Key Endpoints:**
```javascript
// Get all countries with currencies
GET /all?fields=name,cca2,currencies,flag

// Get specific country
GET /alpha/{code}
```

#### 7.6.3 WorldTimeAPI (Timezone)

**Endpoint:** `https://worldtimeapi.org/api`

**Rate Limits:** Unlimited (be polite)

**Caching Strategy:** 24 hours TTL for timezone, don't cache current time

**Key Endpoints:**
```javascript
// Get time by IP
GET /ip

// Get time by timezone
GET /timezone/{area}/{location}
// Example: /timezone/America/New_York
```

### 7.7 UI Enhancement APIs

#### 7.7.1 Clearbit Logo (Merchant Icons)

**Endpoint:** `https://logo.clearbit.com`

**Rate Limits:** Unlimited (no auth)

**Caching Strategy:** 7 days TTL, cache in localStorage

**Usage:**
```javascript
// Get company logo (returns PNG)
https://logo.clearbit.com/{domain}

// Examples:
https://logo.clearbit.com/netflix.com
https://logo.clearbit.com/amazon.com
https://logo.clearbit.com/spotify.com

// Fallback for failed logos: use category icon
```

**Domain Extraction Logic:**
```javascript
// Convert merchant names to domains
"NETFLIX" → "netflix.com"
"AMAZON PRIME" → "amazon.com"
"SPOTIFY USA" → "spotify.com"
"UBER *EATS" → "uber.com"
```

**Fallback Chain:**
```
Clearbit → Category icon → First letter avatar
```

#### 7.7.2 QuickChart (Export Charts)

**Endpoint:** `https://quickchart.io`

**Rate Limits:** Unlimited (no auth)

**Caching Strategy:** Don't cache (generated on demand)

**Usage:**
```javascript
// Generate chart image
GET /chart?c={chartConfig}&w=600&h=400&f=png

// Chart config is URL-encoded JSON
const config = {
  type: 'pie',
  data: {
    labels: ['Food', 'Transport', 'Entertainment'],
    datasets: [{ data: [300, 150, 100] }]
  }
};

const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}`;
```

### 7.8 News & Content APIs

#### 7.8.1 News API

**Endpoint:** `https://newsapi.org/v2`

**Rate Limits:** 100 requests/day (dev tier)

**Caching Strategy:** 30 minutes TTL (be very conservative!)

**API Key:** `b04754f709c4439ea8e1a4a280c737cc`

**Key Endpoints:**
```javascript
// Get business news
GET /top-headlines?category=business&apiKey={key}

// Search news
GET /everything?q={query}&apiKey={key}&sortBy=publishedAt&pageSize=10
```

> [!WARNING]
> **Only 100 calls/day! Cache aggressively and debounce search by 500ms.**

### 7.9 Utility APIs

#### 7.9.1 UUIDTools (ID Generation)

**Endpoint:** `https://www.uuidtools.com/api`

**Rate Limits:** Unlimited

**Caching Strategy:** Batch generate 100, cache for 7 days

**Usage:**
```javascript
// Generate single UUID v4
GET /generate/v4

// Generate multiple
GET /generate/v4/count/10

// Response: ["uuid1", "uuid2", ...]
```

#### 7.9.2 Faker API (Demo Data)

**Endpoint:** `https://fakerapi.it/api/v1`

**Rate Limits:** Unlimited

**Caching Strategy:** 24 hours TTL for consistency

**Key Endpoints:**
```javascript
// Generate companies
GET /companies?_quantity=20

// Generate persons
GET /persons?_quantity=10

// Generate addresses
GET /addresses?_quantity=10

// Generate texts (for descriptions)
GET /texts?_quantity=5&_characters=100

// Custom (combine data)
GET /custom?_quantity=50&name=company&amount=counter&date=date
```

#### 7.9.3 Random User Generator

**Endpoint:** `https://randomuser.me/api`

**Rate Limits:** Unlimited (be polite, 1 req/sec)

**Caching Strategy:** 7 days TTL (user profiles for demo)

**Usage:**
```javascript
// Generate users
GET /?results=5&inc=name,email,picture,location

// Response includes profile photos!
{
  results: [{
    name: { first: "John", last: "Doe" },
    email: "john@example.com",
    picture: {
      thumbnail: "https://randomuser.me/api/portraits/thumb/men/1.jpg",
      medium: "https://randomuser.me/api/portraits/med/men/1.jpg"
    }
  }]
}
```

#### 7.9.4 Abstract Email Verification

**Endpoint:** `https://emailvalidation.abstractapi.com/v1`

**Rate Limits:** 100/month (free tier)

**Caching Strategy:** 30 days TTL per email

**API Key:** `c06de9698fc14b549cc7ceea8ad2e6d1`

**Usage:**
```javascript
GET /?api_key={key}&email={email}

// Response:
{
  email: "test@example.com",
  deliverability: "DELIVERABLE",
  is_valid_format: true,
  is_disposable_email: false,
  is_mx_found: true
}
```

> [!WARNING]
> **Only 100/month! Cache results forever once validated.**

### 7.10 API Call Budget Calculator

#### Daily Budget (Conservative)

| API | Calls/Day | Current Usage | Remaining |
|-----|-----------|---------------|-----------|
| CoinGecko | 1800 (30/min) | ~200 | 1600 |
| CoinMarketCap | 333 | ~50 | 283 |
| News API | 100 | ~30 | 70 |
| ipapi.co | 1000 | ~5 | 995 |
| ExchangeRate-API | 50/day avg | ~10 | 40 |

#### Monthly Budget

| API | Calls/Month | Status |
|-----|-------------|--------|
| Abstract Email | 100 | Be careful |
| ExchangeRate-API | 1500 | OK |
| OCR.space (future) | 500 | Reserved |

### 7.11 API Fallback Chains

```
Crypto: CoinGecko → CoinMarketCap → Cached data
Exchange: Frankfurter → ExchangeRate-API → Cached data
Location: ipapi.co → Cached data → Default (USD)
Logos: Clearbit → Category icon → First letter avatar
```

### 7.12 Quick Reference

#### No Auth Required (Unlimited)
- Frankfurter
- Clearbit Logo
- WorldTimeAPI
- QuickChart
- UUIDTools
- Faker API
- Random User
- REST Countries

#### No Auth Required (Limited)
- ipapi.co (1000/day)
- ExchangeRate-API (1500/month)
- CoinGecko (50/min without key)

#### Auth Required
- CoinGecko with key (30/min)
- CoinMarketCap (333/day)
- News API (100/day)
- Abstract Email (100/month)
- FRED (unlimited with demo key)

### 7.13 Implementation Checklist

- [ ] Store all API keys in environment variables (`.env.local`)
- [ ] Implement caching layer with TTL per API (see section 7.4-7.9 for specific TTLs)
- [ ] Add debounce to all search fields (300-500ms)
- [ ] Implement rate limit protection for all APIs
- [ ] Add fallback chains for critical features (crypto, exchange, logos)
- [ ] Create API usage tracker for debug tool
- [ ] Add error handling with user-friendly messages
- [ ] Log API usage in dev mode for monitoring
- [ ] Never expose API keys in client-side code
- [ ] Rotate through data sources when possible to spread load

---

## 8. Testing & Verification Strategy

### 8.1 Testing Framework Decision

> [!IMPORTANT]
> **Framework:** Jest  
> **Reasoning:** Jest is the recommended testing framework for Next.js projects, provides excellent TypeScript support, built-in mocking, and snapshot testing capabilities.

### 8.2 Test Coverage Targets

> [!NOTE]
> **Coverage Philosophy:** Only critical logic needs high coverage. UI components only need smoke tests.

**Target: ~80%+ coverage for:**
- ✅ Suspicious charge logic (duplicate, overcharge, unexpected)
- ✅ Internal transfer netting logic
- ✅ Date range logic
- ✅ Transaction math helpers

**UI Components:** Smoke tests only (basic rendering, no crashes)

### 8.3 Performance Benchmarks

> [!IMPORTANT]
> **Performance Target:** Ensure the app remains stable with 5,000–10,000 generated transactions.

**Benchmark Requirements:**
- [ ] Generate 5,000 transactions: App loads within 3 seconds
- [ ] Generate 10,000 transactions: App loads within 5 seconds
- [ ] Suspicious charge detection completes within 2 seconds for 10,000 transactions
- [ ] Date range changes re-render within 1 second
- [ ] Statement regeneration completes within 3 seconds

**No other benchmarks required.** Focus on transaction volume stability.

### 8.4 Phase-End Testing Rule

> [!NOTE]
> **`npm test` and full `npm run build` checks are reserved for phase-end milestones, not every micro-step.**

### 8.5 Per-Phase Verification Commands

#### End of Phase 1
```bash
npm run lint
npm run dev   # Manual smoke test of UI changes
npm run build
```

#### End of Phase 2
```bash
npm run lint
npm run dev   # Deep manual testing of logic
npm test      # Run Jest test suite
npm run test:coverage  # Check coverage targets
npm run build
```

#### End of Phase 3
```bash
npm run lint
npm run dev   # Comprehensive UX testing
npm test      # Full test suite
npm run test:coverage  # Final coverage check
npm run build # Production build verification
```

### 8.6 Browser-Based Manual Verification

- [ ] Use browser tools to verify each phase's changes
- [ ] Check at `http://localhost:3000/`
- [ ] Test all major user flows:
  - [ ] Dashboard → Overview → Statement navigation
  - [ ] Subscription suspicious charge detection
  - [ ] Stock/Crypto search and portfolio management
  - [ ] My Accounts editing and net worth calculation
  - [ ] Review tab data accuracy

### 8.7 Jest Setup Requirements

**Installation:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

**Configuration Files to Create:**
- [ ] `jest.config.js` - Main Jest configuration
- [ ] `jest.setup.js` - Test environment setup
- [ ] `.babelrc` or `babel.config.js` - If needed for TypeScript

**Package.json Scripts to Add:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 8.8 Required Test Coverage (Phase 2)

#### 8.8.1 Suspicious Charge Detection Tests

**File:** `__tests__/logic/suspiciousCharges.test.ts`

**Duplicate Charge Detection Tests:**
- [ ] Test: Same amount, outside normal frequency → Suspicious
- [ ] Test: Same amount, within 3-day forgiveness → Not suspicious
- [ ] Test: Multiple Apple services with different amounts → Not suspicious if recurring
- [ ] Test: Charge appearing 5+ months after last occurrence → Suspicious
- [ ] Test: Charge recurring 3+ times in 5 months → Normal recurring
- [ ] Test: Edge case - Exactly 3 days apart → Not suspicious
- [ ] Test: Edge case - 4 days apart with monthly pattern → Suspicious

**Overcharge Detection Tests:**
- [ ] Test: Higher amount within expected date window, no normal charge → Overcharge
- [ ] Test: Higher amount + normal charge in same window → Check if unexpected
- [ ] Test: Amount within $0.10 tolerance → Not suspicious
- [ ] Test: Edge case - Exactly $0.10 difference → Not suspicious
- [ ] Test: Edge case - $0.11 difference → Suspicious

**Unexpected Charge Detection Tests:**
- [ ] Test: Amount not seen in previous/next month → Unexpected
- [ ] Test: Amount not seen in last 3 months → Unexpected
- [ ] Test: Amount within $0.10 of standard → Not suspicious
- [ ] Test: Edge case - One-time purchase from subscription merchant → Unexpected
- [ ] Test: Edge case - Annual charge from monthly subscription → Not unexpected if pattern exists

#### 8.8.2 Internal Transfer Netting Tests

**File:** `__tests__/logic/transferNetting.test.ts`

- [ ] Test: Money sent vs received calculation
- [ ] Test: Transfers excluded from spending totals
- [ ] Test: Net portfolio calculations
- [ ] Test: Money left after bills calculation
- [ ] Test: Edge case - Transfer to self (same account) → Net zero
- [ ] Test: Edge case - Multiple transfers same day → Correct aggregation
- [ ] Test: Zelle transfers excluded from P2P category

#### 8.8.3 Date Range Logic Tests

**File:** `__tests__/logic/dateRange.test.ts`

- [ ] Test: Debug tool changes stored date range
- [ ] Test: Statements dropdown changes viewed date range
- [ ] Test: Date range extension preserves merchant set
- [ ] Test: Full regeneration creates new merchant set
- [ ] Test: Edge case - Date range spans multiple years
- [ ] Test: Edge case - Single day date range
- [ ] Test: Default date range uses current date as end

#### 8.8.4 Transaction Math Helpers Tests

**File:** `__tests__/logic/transactionMath.test.ts`

- [ ] Test: Income calculation excludes transfers
- [ ] Test: Spending calculation excludes transfers
- [ ] Test: Net cashflow = Income - Spending
- [ ] Test: Subscription total calculation
- [ ] Test: Fees total calculation
- [ ] Test: Category totals match transaction sums
- [ ] Test: Edge case - Negative amounts handled correctly
- [ ] Test: Edge case - Zero amount transactions

### 8.9 UI Component Smoke Tests

**File:** `__tests__/components/smokeTests.test.tsx`

- [ ] Test: Dashboard renders without crashing
- [ ] Test: Overview renders without crashing
- [ ] Test: Statements renders without crashing
- [ ] Test: Recurring renders without crashing
- [ ] Test: Fees renders without crashing
- [ ] Test: Review renders without crashing
- [ ] Test: My Accounts renders without crashing
- [ ] Test: Stocks renders without crashing
- [ ] Test: Crypto renders without crashing

### 8.10 Performance Benchmark Tests

**File:** `__tests__/performance/transactionVolume.test.ts`

- [ ] Test: Generate 5,000 transactions and measure load time (< 3s)
- [ ] Test: Generate 10,000 transactions and measure load time (< 5s)
- [ ] Test: Suspicious charge detection with 10,000 transactions (< 2s)
- [ ] Test: Date range change re-render with 10,000 transactions (< 1s)
- [ ] Test: Statement regeneration with 10,000 transactions (< 3s)

### 8.11 Test Directory Structure

```
__tests__/
├── logic/
│   ├── suspiciousCharges.test.ts
│   ├── transferNetting.test.ts
│   ├── dateRange.test.ts
│   └── transactionMath.test.ts
├── components/
│   └── smokeTests.test.tsx
├── performance/
│   └── transactionVolume.test.ts
└── utils/
    └── testHelpers.ts
```

### 8.12 Coverage Report Configuration

**jest.config.js coverage settings:**
```javascript
module.exports = {
  collectCoverageFrom: [
    'src/logic/**/*.{ts,tsx}',
    'src/utils/math/**/*.{ts,tsx}',
    'src/utils/dateRange/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThresholds: {
    'src/logic/suspiciousCharges/**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/logic/transferNetting/**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/utils/math/**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## 9. Concerns, Open Questions & Blockers

### 9.1 API-Related Concerns

- [x] **Merchant Images API**: ✅ **RESOLVED**
  - Using Clearbit Logo API: `https://logo.clearbit.com/{domain}`
  - Unlimited, no auth required
  - Fallback chain: Clearbit → Category icon → First letter avatar
  - See section 7.4 for implementation details

- [x] **Crypto API (CoinGecko)**: ✅ **RESOLVED**
  - API Key available: `CG-6BZouhuMK3pj4Q2HxH4jZgab`
  - Rate limit: 30 calls/min with key
  - Fallback: CoinMarketCap (333 calls/day)
  - Caching: 1 min TTL for live prices

- [x] **Stock API**: ✅ **RESOLVED**
  - Using Yahoo Finance (yahoo-finance2 v3)
  - Rate limit: ~2000 calls/hour (unofficial)
  - Rich data available: quotes, charts, insights, trending
  - Caching: 1 min for quotes, 30 min for news, 24 hours for company info

### 9.2 Deep Logic Concerns (High Priority)

- [ ] **Suspicious Charge Detection Algorithm** ⚠️ **TOP PRIORITY**
  - This is highly complex with multiple edge cases
  - The 3-day forgiveness window logic
  - Multi-plan same-merchant handling (Apple example)
  - $0.10 amount tolerance
  - Need Claude Opus for implementation
  - **MUST include comprehensive test coverage** (see section 8.5)

- [ ] **Internal Transfer Netting** ⚠️ **TOP PRIORITY**
  - Affects multiple calculations across the app
  - Must be consistent everywhere
  - Consider creating dedicated math folder
  - **MUST include test coverage for all netting calculations**

- [ ] **Date Range Deep Issue** ⚠️ **TOP PRIORITY**
  - Current behavior shows fixed dates regardless of selection
  - Debug tool vs Statements dropdown have different roles
  - Need careful state management
  - **MUST include test coverage for date range logic**

### 9.3 User Decisions (Resolved)

- [x] **Plaid Integration:** NOT part of this phase - keep as "Coming soon" only
- [x] **Test Requirements:** YES - add comprehensive tests for suspicious charge detection algorithms
- [x] **Merchant Pool Data:** Should be hardcoded (not user-customizable)
- [x] **Phase 2 Priorities:** Transaction data generation, suspicious charge detection, and math performance are TOP PRIORITY

### 9.4 Resolved Questions

- [x] **Test Framework Choice**: ✅ **RESOLVED** - Use Jest (recommended for Next.js)
- [x] **Test Coverage Target**: ✅ **RESOLVED** - ~80%+ coverage for critical logic (suspicious charges, transfer netting, date range, transaction math). UI components only need smoke tests.
- [x] **Performance Benchmarks**: ✅ **RESOLVED** - Ensure app remains stable with 5,000–10,000 generated transactions. No other benchmarks required.

---

## Next Steps

**Immediate Next Action:** Review this PLAN.md document for accuracy and completeness.

**Recommended Model for First Phase 1 Implementation:** Claude Sonnet 4.5 or Gemini High for the Dashboard and UI restructuring work.

---

> **Document Version:** 1.0  
> **Last Updated:** December 5, 2025  
> **Awaiting:** User review and approval before proceeding to Phase 1 execution
