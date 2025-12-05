# Phase2Plan — Phase-Based To-Do Checklist for MoneyMap

> Every piece of text below is authoritative.  
> Do \*\*not\*\* delete, compress, or ignore details.  
> Use this as a bible for all work.

---

## 0\. Global Rules for the Agent

* \[ ] You are **only making a plan right now**.

  * \[ ] You can look around the site, read files, and analyze, but **do not start implementing changes yet**.
  * \[ ] Put real time into building the plan.

* \[ ] Create and maintain a document in the repo called **`PLAN.md`**.

  * \[ ] This Phase2Plan text is the blueprint you follow to build that `PLAN.md`.
  * \[ ] `PLAN.md` must be long, detailed, and organized as **checkbox to-do lists**, not prose descriptions.

* \[ ] Treat every piece of text from the user as **bible**:

  * \[ ] Do **not** simplify away details.
  * \[ ] Do **not** remove examples, even if you think you “understand” them.
  * \[ ] Only **organize** and add clear implementation steps and structure.

* \[ ] When building `PLAN.md`, you can be creative in how you:

  * \[ ] Name components or files (for clarity).
  * \[ ] Organize tasks into groups and phases.
  * \[ ] Add helpful comments or concerns.
  * \[ ] But you cannot ignore or contradict any instruction in this document.

* \[ ] Use **Chrome Preview**:

  * \[ ] Use the Chrome preview tool to open the site and analyze any UI/UX or data problems.
  * \[ ] Visit the website whenever you’re confused about what a section looks like.
  * \[ ] Use Chrome preview again **after fixes** to verify that each issue is actually resolved.

* \[ ] Commands to run while implementing:

  * \[ ] `npm run lint` to check for lint issues.
  * \[ ] `npm run dev` while developing and testing pages.
  * \[ ] Re-run lint/dev whenever you finish a chunk of work.
  * \[ ] Only run `npm run build` **after the entire to-do list for the current phase is done** and you expect a successful build.

* \[ ] Phased workflow:

  * \[ ] **Phase 1** — non-deep reasoning, no heavy math or logic, just simple UI edits, quick fixes, moving components, basic behavior wiring. No big file-building or deep error research.
  * \[ ] **Phase 2** — deeper, higher-risk logic: APIs, transaction analysis/creation/randomization/organization, math and date logic, deep bug hunting.
  * \[ ] **Phase 3** — final review and polish: verify everything works functionally with new updates, fill remaining gaps, make it “pretty”, add organized, tasteful animations/colors, and run full testing.

* \[ ] Critical constraint:

  * \[ ] **Never solve work from two or more phases in the same response/commit.**
  * \[ ] Finish one phase, stop, present results, and wait for user review before starting the next.

* \[ ] Phase 3 “pretty” expectations:

  * \[ ] Use creative imagination to make things organized and visually appealing.
  * \[ ] Add good-looking elements, better animations, or colors to give the website flavor without making it bland or childish.
  * \[ ] Test everything: clicks, opens, scrolls, drags, hover states, and mobile interactions.

* \[ ] If you try and try and can’t figure something out **without outside help**:

  * \[ ] Clearly state where you’re stuck and what you tried.
  * \[ ] Leave a note in `PLAN.md` for the user.

* \[ ] When writing prompts for future chats:

  * \[ ] It’s fine to describe **what needs to be done**, the concerns, and the problems in detail **without** giving the full solution yet.
  * \[ ] Include every detail and example from the user’s words so later a deeper reasoning model can solve them precisely.

* \[ ] General rule for code:

  * \[ ] You can change element names, refactor, and update identifiers to make the code clearer.
  * \[ ] But do not remove required behavior or logic.

---

## 1\. Phase Overview

### 1.1 Phase 1 – Low-Risk UI \& Layout Work

> “Phase one will be the non deep reasoning or math or logic stuff, just simple ui edits or quick fixes or moving stuff like along that lines, no file building, math reasonsing, deep error research – that will be phase 2.”

* \[ ] Focus:

  * \[ ] Simple UI edits and visual tweaks.
  * \[ ] Moving or reorganizing layout components.
  * \[ ] Basic behavior hooks (wiring up existing buttons/popups).
  * \[ ] Mobile responsiveness fixes that don’t require complex data changes.

* \[ ] Avoid:

  * \[ ] Deep math logic.
  * \[ ] Complex transaction generation logic.
  * \[ ] Architectural refactors or new math folders.

### 1.2 Phase 2 – Deep Logic, APIs, Transactions, Math

> “In phase two youll fix stuff that has a higher risk of not solving correctly. One big part of phase two should be APIs and transaction analziation, creation, radmization,organization...”

* \[ ] Focus:

  * \[ ] All API integration and rate limiting.
  * \[ ] Transaction creation, randomization, and lifestyle modeling.
  * \[ ] Suspicious charge detection logic.
  * \[ ] Date range, statement ranges, and internal transfer math.
  * \[ ] Fixing deep demo-data issues (recurring not showing, subscription problems, etc.).

### 1.3 Phase 3 – Final Review \& “Pretty” Polish

> “Phase 3 itll be a final review to make sure everything works fucntionallya nd has been resolved in the best way with the new updates… Phase 3 will be a ‘pretty’ process.”

* \[ ] Focus:

  * \[ ] See what’s new, what’s different, what’s still missing, what’s not working.
  * \[ ] Make everything visually consistent, organized, and premium.
  * \[ ] Add tasteful animations, colors, and glass/under-glow effects.
  * \[ ] Comprehensive interaction testing across all devices and flows.

---

## 2\. Phase 1 – UI, Layout, Light Behavior

### 2.1 Dashboard Introduction \& Summary Boxes

* \[ ] Add a **Dashboard** at the beginning of the experience.

  * \[ ] At the top of the dashboard, add summary boxes with values like:

    * \[ ] **Income** — example value `$68,181.95`
    * \[ ] **Spending** — example value `$28,893.26`
    * \[ ] **Net Cashflow** — example value `$39,288.69`
    * \[ ] **Subscriptions** — example value `$509.65`
    * \[ ] **Fees** — example value `$184.75`

  * \[ ] These values can come from demo data logic (Phase 2 for exact math), but UI and structure belong here.
  * \[ ] Style the boxes as premium cards that look good on dark theme and on mobile.

### 2.2 Location Box Removal \& IP in Debug

* \[ ] Remove the entire **“YourLocation” box** wherever it appears.
* \[ ] Integrate location/IP in different ways:

  * \[ ] Add **IP address and location** into the **debug menu**, not on main Overview.
  * \[ ] Ensure no leftover “YourLocation” text remains in the UI.

### 2.3 Clock \& Greeting on Dashboard

* \[ ] On the Dashboard, use **local time** as a digital clock at the top:

  * \[ ] Display time **without seconds**.
  * \[ ] Include **AM/PM**.
  * \[ ] Use abbreviated time zone format like **CST, EST, MT, PT**.

* \[ ] Add greeting logic:

  * \[ ] “Good Morning”, “Good Afternoon”, “Good Evening” based on local time ranges.

* \[ ] Ensure this clock/greeting combo is responsive and visually clean.

### 2.4 Currency Converter UI Defaults \& Crypto Conversion UI

* \[ ] Do **not** create a separate box for “detected currency type”.
* \[ ] In the **Currency Converter**:

  * \[ ] Default the **“From” amount currency** to the **detected currency**.

* \[ ] Add a **Crypto Currency conversion section**:

  * \[ ] Allow converting from **USD or detected currency** to a selected **crypto type**, and vice versa.
  * \[ ] Default “From” as USD (or detected currency) and “To” as crypto.
  * \[ ] Add a **swap button** that switches “From” and “To”.
  * \[ ] Use current exchange rate (wired in Phase 2, but UI should be ready in Phase 1).

### 2.5 Dashboard News \& Economic Indicators

* \[ ] Move **Financial News** to the **Dashboard**.
* \[ ] Rename section to **“Recent News”**.
* \[ ] Inside this section, structure news in this order:

  * \[ ] Financial
  * \[ ] Business
  * \[ ] Technology
  * \[ ] Stock
  * \[ ] Cryptocurrency

* \[ ] Add **Economic Indicators** section on Dashboard:

  * \[ ] UI with placeholders for indicators (Phase 2 will handle data).

* \[ ] Ensure the **Overview page** focuses only on **user’s own accounts** and not global news.

### 2.6 Overview Page Layout \& Pie Chart

* \[ ] Update the main Overview **pie chart**:

  * \[ ] Make it a **full circle** (or equally clear) instead of partial.
  * \[ ] Ensure readability and premium visual style.

* \[ ] Keep **5 boxes** on the Overview tab:

  * \[ ] Place them **between**:

    * \[ ] The group that shows **7 pie chart categories**, and
    * \[ ] The **12 transaction categories** shown in your provided image.

* \[ ] In the transactions section:

  * \[ ] Make “Select a category group to see transactions.” much **more obvious** when no data is loaded:

    * \[ ] Larger font, higher contrast, or dedicated empty-state styling.

### 2.7 Remove API Branding Text from UI

* \[ ] On any tab where the UI mentions the API explicitly (for example, Overview text like:

  * \[ ] “Real-time exchange rates • Free API (no key required)”

* \[ ] Remove these informational phrases:

  * \[ ] We do not need to advertise API providers or whether they’re free in the user UI.

### 2.8 Mobile Friendly Layouts

* \[ ] Ensure the website is **mobile friendly**:

  * \[ ] On the Statements page and any table-heavy views:

    * \[ ] When text fields/columns are too wide on mobile:

      * \[ ] Show only the most important information.
      * \[ ] Optionally **truncate description names** with ellipsis.
      * \[ ] Allow the user to **tap the transaction** to open a detailed view/modal with full description.

  * \[ ] Test other critical pages for responsive layout and adjust as needed.

### 2.9 Search / Featured Pages Relevance (UI Layer)

* \[ ] Wherever there are featured pages or search results:

  * \[ ] Implement sorting by a **relevance function**.
  * \[ ] In Phase 1 this can be basic (e.g., static priority, popularity ranking).
  * \[ ] Phase 2 can refine to deeper algorithms if needed.

### 2.10 Sidebar Demo Controls

* \[ ] Add a **“Restart Demo”** button:

  * \[ ] Place it at the bottom of the side menu **above** where it says “Demo Mode” in the bottom right.
  * \[ ] When clicked:

    * \[ ] Reset all demo data back to initial state.
    * \[ ] Bring the user back to the **home screen**.

  * \[ ] Confirm that all tabs then reflect cleared/regenerated demo data according to Phase 2 logic.

---

## 3\. Phase 2 – Deep Logic, APIs, Data \& Math

### 3.1 API Infrastructure \& Rate Limiting

* \[ ] For **all APIs** (exchange rates, stocks, crypto, news, etc.):

  * \[ ] Implement a **rate limit or debounce** so users cannot spam-click and waste credits.
  * \[ ] Ensure this applies to:

    * \[ ] Search fields.
    * \[ ] “Refresh” buttons.
    * \[ ] Statement regeneration or any action that triggers network calls.

* \[ ] Debug tool – tokens used:

  * \[ ] Add ability in the debug tool to show **API tokens used in the current session** for each API key.
  * \[ ] Present this via:

    * \[ ] A dropdown, button, or popup.
    * \[ ] Avoid cluttering the main debug panel with token stats.

* \[ ] Add **rate limiting status** to debug tool:

  * \[ ] Show whether each API is:

    * \[ ] Within safe limits.
    * \[ ] Near rate-limit.
    * \[ ] Temporarily limited.

* \[ ] Make sure **all required files and code** for the APIs we want to use actually exist:

  * \[ ] Even if API keys are missing, the structure and placeholders must be ready.
  * \[ ] Document where keys should be inserted.

---

### 3.2 Statements Tab – Dates, Merchants, and Regeneration

#### 3.2.1 Merchant Images

* \[ ] On the Statements tab, merchant images for merchant logos are not working.

  * \[ ] Investigate the current image source API or CDN.
  * \[ ] If you cannot fix it:

    * \[ ] Identify exactly **what is needed** (which API, what endpoint, whether a key is required).
    * \[ ] Record this in `PLAN.md` so the user can research and provide an API key.

  * \[ ] Do not silently ignore missing images.

#### 3.2.2 Month-by-Month Dropdown \& Date Gaps

* \[ ] Make the Statements tab able to **drop down month by month**:

  * \[ ] Add month/year dropdowns to select a **From** and **To** month/year.
  * \[ ] Use select inputs, not free-text.

* \[ ] Fix the **random date jump** problem (e.g., from December 2 to December 22):

  * \[ ] Re-examine how transaction dates are generated.
  * \[ ] Ensure continuous, realistic coverage across the chosen range, unless gaps are intentional (e.g., days with no transactions).

#### 3.2.3 Editing Generated Transaction Date Ranges

* \[ ] Allow the user to **edit generated transaction date ranges** (e.g., via debug or UI control):

  * \[ ] When the date range is changed:

    * \[ ] Regenerate **all transaction date ranges** on all pages (Statements, Overview, Recurring, Subscriptions, etc.).
    * \[ ] This change alone does **not** necessarily regenerate data values.

  * \[ ] When the date range is **extended**:

    * \[ ] Add new transactions only for the additional time period.
    * \[ ] Keep the **same set of random merchants** that were chosen for that generation.
    * \[ ] Example:

      * \[ ] If a generation originally included one insurance provider, then any new transactions falling in the extended dates should use that **same insurance provider**.

  * \[ ] If the user clicks a **“New Statements”** button:

    * \[ ] Treat it as a **full regeneration**:

      * \[ ] New lifestyle profile.
      * \[ ] New merchant set (within the allowed pools).
      * \[ ] New transactions.

* \[ ] Name the full regeneration button something like **“New Statements”**.

---

### 3.3 Demo Data Deep Issue – Recurring \& Subscription Charges

* \[ ] There is a deep issue with the **demo fake data**:

  * \[ ] Charges for **recurring** or **subscriptions** often do **not** show up properly.

* \[ ] Correct behavior:

  * \[ ] Charges for recurring/subscription merchants should normally:

    * \[ ] Come out at the **same amounts** every cycle.

  * \[ ] There are only two valid cases where amounts differ:

    1. It is a **suspicious charge** (duplicate/overcharge/unexpected – see below).
    2. There is a **separate group of recurring/subscription prices** from the **same merchant** that legitimately occur at different frequencies/amounts.

       * \[ ] Example:

         * \[ ] Apple charges:

           * \[ ] $15 on the 12th of each month for iCloud.
           * \[ ] $9.99 on the 1st of each month for AppleCare.
           * \[ ] $3.99 every 2 weeks on the 4th and 18th for a weight-loss app.

         * \[ ] None of these should be suspicious even though the merchant name is `Apple.com`.

* \[ ] Implement logic so that:

  * \[ ] Recurring/subscription amounts are stable, except for legitimate multi-plan setups or flagged suspicious anomalies.

---

### 3.4 Lifestyle Model \& Merchant Sets (Randomization Logic)

#### 3.4.1 Personal Lifestyle Model per Generation

* \[ ] Build a **personal lifestyle model** for each statement generation:

  * \[ ] Select a coherent set of **real merchant names** and how they appear on transactions.
  * \[ ] Use this set consistently across all pages for that generation.

* \[ ] Rules:

  * \[ ] A person typically:

    * \[ ] Uses only a small set of grocery stores and fast food spots.
    * \[ ] Has only **one** mortgage provider.
    * \[ ] Has 1–3 credit card names (with possible multiple cards per issuer).

  * \[ ] Transfers to/from other banks should primarily come from selected **3–5** main accounts.
  * \[ ] On each regeneration of statements (when not just extending date range):

    * \[ ] Recalculate the **personal lifestyle choices**:

      * \[ ] Banks.
      * \[ ] Credit card merchants.
      * \[ ] Subscription services.

    * \[ ] Apply this lifestyle to the **My Accounts** page as well.

  * \[ ] Think of other common personal lifestyle patterns (e.g., ride-share frequency, coffee habits, online shopping) and integrate them into the randomization logic.
  * \[ ] In real data runs, the number of accounts may vary widely; the logic should adapt but still feel realistic.

#### 3.4.2 Target Counts of Merchants Per Generation (Actually Used)

* \[ ] For each generated statement profile, target these **counts of distinct merchants used**:

  * \[ ] Streaming services: **2–5**
  * \[ ] Music: **1–3**
  * \[ ] Cloud storage: **1–3**
  * \[ ] Gym: **1–2** (prioritize 1)
  * \[ ] Software: **2–6**

    * \[ ] Also pick **1–3 random subscriptions** (HelloFresh, magazines, etc.).

  * \[ ] Crypto services/exchanges: **1–3**
  * \[ ] Stocks (for portfolio holdings): **4–10**
  * \[ ] Loans: **1–3**
  * \[ ] Credit cards: **1–4**
  * \[ ] Bank-like accounts (including PayPal, Cash App, Venmo, and other P2P except Zelle): **3–5** total across:

    * \[ ] Checking accounts: **1–3**
    * \[ ] Savings accounts: **2–4**

  * \[ ] Investment companies (brokerages): **1–2**
  * \[ ] MMSA (Money Market Savings Account): **1**
  * \[ ] Certificates (CDs): **1**
  * \[ ] Rent or Mortgage: **1** (must pick one, not both).
  * \[ ] Utilities: **2–5** (electric, gas, water, combined “utilities”).
  * \[ ] Phone subscriptions: **1–3** (prioritize 1).
  * \[ ] Car insurance: **1–2** (prioritize 1).
  * \[ ] Life insurance: **1**
  * \[ ] Home insurance: **1**
  * \[ ] Health insurance: **1**
  * \[ ] Rideshare/transport services: **1–3**
  * \[ ] Food delivery: **1–3**
  * \[ ] Gas/Convenience stores: **2–5**
  * \[ ] Grocery stores: **2–6**
  * \[ ] Restaurants (dine-in): **4–5** (use sparingly compared to fast food).
  * \[ ] Fast food: **5–10**
  * \[ ] Other food/drink (coffee shops, etc.): **2–4**
  * \[ ] General shopping stores (non-food): **3–6**
  * \[ ] Online shopping merchants: **3–5**
  * \[ ] Unknown/random/other merchants: **4–5**
  * \[ ] Credit card issuers: **2–5**

    * \[ ] Use 1–2 dedicated credit card companies; fill remaining with cards from banks already used.

#### 3.4.3 Global Pool of Possible Merchants (Selection Universe)

* \[ ] Create pools of **possible merchants** for each category, from which per-generation subsets are drawn:

  * \[ ] Streaming services (TV/Video): **15**

    * \[ ] Examples: Netflix, Hulu, HBO Max, Plex, Crunchyroll, YouTube TV, YouTube Premium, Apple TV, etc.

  * \[ ] Music: **8**

    * \[ ] Examples: Apple Music, YouTube Music, Spotify, SoundCloud, etc.

  * \[ ] Cloud storage: **8**

    * \[ ] Examples: iCloud, Google Drive, Dropbox, OneDrive, etc.

  * \[ ] Gyms: **15** (real gym chains).
  * \[ ] Software subscriptions: **20**

    * \[ ] Weight loss apps, coding tools, AI subs (ChatGPT, Gemini), music studio software, Adobe suite, etc.
    * \[ ] Include 1–3 random subscriptions like HelloFresh, magazine subscriptions, etc.

  * \[ ] Crypto assets/exchanges: **8** (XRP, BTC, ETH, etc.).
  * \[ ] Stocks: **50** (real tickers: TSLA, GOOG, NVDA, etc.).
  * \[ ] Loans: **20** (bank-based names).
  * \[ ] Banks: **20** (Navy Federal, JP Morgan, Chase, Synchrony Bank, etc.).
  * \[ ] Credit cards: **15** (combination of banks and dedicated credit card companies).
  * \[ ] Other bank-like accounts / P2P services:

    * \[ ] PayPal, Cash App, Venmo, etc. (exclude Zelle).

  * \[ ] Rent/Mortgage providers: **15** (real lenders and property managers).
  * \[ ] Utilities: **25** (electric, gas, water, combined utilities).
  * \[ ] Phone subscriptions: **10**
  * \[ ] Car insurance: **10**
  * \[ ] Life insurance: **5**
  * \[ ] Home insurance: **5**
  * \[ ] Health insurance: **5**

    * \[ ] Insurance merchants may bundle multiple insurance types.

  * \[ ] Rideshare / transport: **7**

    * \[ ] Uber, Lyft, scooters, bikes, rentals, etc.

  * \[ ] Food delivery: **15**

    * \[ ] Grubhub, Instacart, UberEats, DoorDash, pizza delivery, Chick-fil-A delivery, etc.

  * \[ ] Gas/Convenience stores: **25**

    * \[ ] Buc-ee’s, Circle K, Cumberland Farms, CEFCO, Valero, Raceway, SUNOCO, Wawa, etc.

  * \[ ] Grocery stores: **30**

    * \[ ] Sam’s, Walmart, Target, Whole Foods, Publix, etc.

  * \[ ] Restaurants (dine-in): **25**

    * \[ ] From Waffle House to LongHorn Steakhouse, local chains, etc.

  * \[ ] Fast food: **30** (real, recognizable names).
  * \[ ] Other food/drink (coffee shops): **15** (Starbucks, Dunkin, local cafés, etc.).
  * \[ ] Shopping stores (non-food):

    * \[ ] Best Buy, Lowe’s, Home Depot, hardware stores, World Market, Earthbound, antique shops, Ollie’s, etc.

  * \[ ] Online shopping:

    * \[ ] Etsy, StockX, Amazon, eBay, Walmart.com, BestBuy.com, Target.com, AliExpress, Temu, TikTok Shop, online jewelers, Fashion Nova, generic “online shopping”.

  * \[ ] Unknown/random/other: **4–5**

    * \[ ] Street vendors, gift shops, generic names or messy descriptors.

  * \[ ] Checking accounts: 1–3; Savings: 2–4 with real bank names.
  * \[ ] Investment companies: 1–2 (Vanguard, Fidelity, etc.).
  * \[ ] MMSA \& Certificates:

    * \[ ] Use real bank names.
    * \[ ] Label accounts as Savings, Checking, MMSA, Certificate appropriately.

  * \[ ] Other one-off merchants:

    * \[ ] Mechanic shop, dealership, DMV, etc.

  * \[ ] Credit cards (extended pool): **20**

    * \[ ] At least 5 dedicated credit card companies.
    * \[ ] Fill the rest with cards issued by banks already present.
    * \[ ] Include store cards (Lowe’s, Amazon store card, etc.).

#### 3.4.4 Charge Type Logic (VISA vs ACH)

* \[ ] Use **VISA** as the main type of debit/credit card charge.
* \[ ] Build logic to determine which merchants typically charge via:

  * \[ ] **ACH** (using routing/account numbers, like some utilities, loans, mortgages).
  * \[ ] **VISA** card transactions (in-person and online).

* \[ ] Many merchants (e.g., Lowe’s, Lowe’s CC, PayPal, Cash App, Venmo) may accept both:

  * \[ ] Group these into a category where they can be either ACH or VISA depending on context.

* \[ ] Display rules:

  * \[ ] All debit card purchases done **in person** should be labeled like `VISA\*MERCHANTNAME`.
  * \[ ] Merchants that also allow online orders should be able to show up as:

    * \[ ] The website name (e.g., “LOWES.COM”) or
    * \[ ] `VISA\*MerchantName`.

* \[ ] For each merchant you research or define:

  * \[ ] Categorize its typical display pattern and charge type.
  * \[ ] Make sure the patterns feel legitimate.

#### 3.4.5 Transaction Frequency \& Descriptions

* \[ ] Adjust the **frequency of transactions**:

  * \[ ] Account for increased number of merchants and categories.
  * \[ ] Keep volumes realistic for a normal person (avoid over-cluttered statements).

* \[ ] After each merchant name, add a descriptor **when appropriate**:

  * \[ ] Example: “Gas”, “Food subscription”, “Magazine”, “Transfer”, “Add money”, “Loan payment”.
  * \[ ] Do **not** add descriptors when the merchant name alone clearly implies the purchase (e.g., McDonald’s, Netflix), unless that merchant typically uses extra descriptor text on real statements.

* \[ ] For each merchant:

  * \[ ] Decide whether charges usually include additional descriptors.
  * \[ ] Categorize merchants into logic categories so their descriptions follow consistent rules.

#### 3.4.6 Category Reorganization

* \[ ] Reorganize category logic:

  * \[ ] Replace the **Education** category with **Online Shopping**.
  * \[ ] Change **Groceries** category to a more general **Stores** if that better fits all store merchants.
  * \[ ] Merchants like IKEA, Walmart, Home Depot, Lowe’s should be categorized appropriately (not all thrown into “Other”).

---

### 3.5 Fees Data Generation

* \[ ] For **fees** data:

  * \[ ] Generate realistic fake fees such as:

    * \[ ] ATM fee with the bank name.
    * \[ ] Monthly bank account fees.
    * \[ ] Overdraft fees.
    * \[ ] Late payment fees.

  * \[ ] Use descriptors like “ATM Fee” or “Late payment” followed by which bank or merchant charged it.

* \[ ] Per generation:

  * \[ ] Show **3–6 fee merchants** actually used.
  * \[ ] Have a **pool of ~12 possible fee merchants/types** to choose from.
  * \[ ] Ensure names are realistic and match the bank/merchant patterns.

---

### 3.6 Subscriptions \& Recurring Pages – Suspicious Logic (Deep Issue)

#### 3.6.1 Subscriptions Page UX and Grouping

* \[ ] On **Subscriptions page**:

  * \[ ] Make “Possible duplicate subscriptions detected: 0” (or any count) **much more prominent** to encourage clicks.
  * \[ ] Fix the **“Show details”** button:

    * \[ ] Currently only works on Recurring page, not on Subscriptions.
    * \[ ] Make it work on Subscriptions as well.

* \[ ] Reorganize transaction display:

  * \[ ] Group each **merchant by category**.
  * \[ ] Allow users to **expand** a merchant to see:

    * \[ ] List of charges.
    * \[ ] Prices.
    * \[ ] Dates.
    * \[ ] Which charges are flagged as suspicious.

* \[ ] Change the yellow box title text to:

  * \[ ] **“Suspicious Charges Detected”**.

#### 3.6.2 Number of Suspicious Merchants

* \[ ] Suspicious charges logic must:

  * \[ ] Load and operate correctly with **fake data**.
  * \[ ] Detect suspicious charges from **multiple merchants**:

    * \[ ] At least **3 different merchants**, ideally **2–6**.
    * \[ ] If there are 3 or more suspicious merchants, ensure you see **each type of suspicious pattern** present (duplicate, overcharge, unexpected).

#### 3.6.3 Suspicious Charge Types

Implement three suspicious charge types exactly as described:

##### 1\. Duplicate Charge

* \[ ] Definition:

  * \[ ] 2 or more charges of the **same amount** from the same merchant, **outside its normal frequency pattern**.
  * \[ ] Use a **3-day forgiveness range** when comparing due dates.

* \[ ] Examples to encode:

  * \[ ] Example A (Suspicious):

    * Apple charge $10 on Nov 1.
    * Apple charge $10 on Nov 12.
    * Normal pattern: every 30 days.
    * This is a pattern anomaly → **suspicious**.

  * \[ ] Example B (Not Suspicious – weekday forgiveness):

    * Apple charge $10 on Nov 1.
    * Apple charge $10 on Nov 3.
    * Normal pattern: monthly, but billing may happen only on weekdays.
    * Within a 3-day forgiveness, this is **not suspicious**.

  * \[ ] Example C (Pattern check with slightly different amounts):

    * Apple charge $10 on Nov 1.
    * Apple charge $8.50 on Nov 15.
    * Normal monthly pattern, but multiple Apple services could be billed in the same month.
    * Check for other Apple charges around (+/-3 days) in previous or next month:

      * \[ ] If similar charges appear around that date in adjacent months → **not suspicious**.
      * \[ ] If a similar charge only appears 4+ months apart → may be **suspicious**.
      * \[ ] If the charge recurs more than **3 times in 5 months**, treat as **normal recurring**, unless a new charge appears that is 5+ months away from the last one (then suspicious).

* \[ ] Implement logic that:

  * \[ ] Tracks normal frequency and flags anomalies accordingly.

##### 2\. Overcharge

* \[ ] Definition:

  * \[ ] A charge from a known recurring/subscription merchant that:

    * \[ ] Falls within the **expected date window** (+/-3 days), but
    * \[ ] Is **higher than the expected normal amount**.

* \[ ] Behavior:

  * \[ ] If this is the **only** charge in that date window:

    * \[ ] Mark as **overcharge**.

  * \[ ] If there are **multiple charges** in that date window:

    * \[ ] Check whether the normal expected amount was also charged.
    * \[ ] If yes, see if the higher amount belongs to an **unexpected** one-off purchase (see next type).

##### 3\. Unexpected Charge

* \[ ] Definition:

  * \[ ] A charge from a known subscription/recurring merchant where:

    * \[ ] The amount **does not match** typical amounts for that merchant.
    * \[ ] That specific amount:

      * \[ ] Has not appeared in the month before or after.
      * \[ ] Has not appeared within the last **3 months** before or ahead.

* \[ ] This is a true anomaly and may be:

  * \[ ] Fraud.
  * \[ ] Some extra one-time purchase.

* \[ ] Amount grace:

  * \[ ] If an amount is within **$0.10** of the standard value, treat it as the **same** amount (not suspicious).

#### 3.6.4 Suspicious Charge Details UI

* \[ ] For both Subscriptions and Recurring pages, under “Show details of possible duplicate charges”:

  * \[ ] Add a button like **“More info”**.
  * \[ ] When clicked:

    * \[ ] Show the suspicious charge plus **all nearby charges** from that merchant (regardless of amount).
    * \[ ] Provide a **short explanation** for why each flagged charge is suspicious:

      * \[ ] Duplicate.
      * \[ ] Overcharge.
      * \[ ] Unexpected.

    * \[ ] If multiple suspicious charges share the same merchant block, mark them all clearly.

* \[ ] Add action buttons:

  * \[ ] **Red “Mark suspicious”**.
  * \[ ] **Green “All good”**.
  * \[ ] Map these logically to existing confirm/dismiss buttons:

    * \[ ] Green = “Confirm OK”.
    * \[ ] Red = “Confirm suspicious”.

* \[ ] Change the **first orange button** under “Possible duplicate charges detected”:

  * \[ ] From “Show details” to something like **“Review now”** to make the call to action stronger.

* \[ ] Make the **purple background box** on this page **about 50% more transparent**.

---

### 3.7 Editing Transactions \& Suspicious Counts

* \[ ] When all suspicious charges are marked as reviewed (e.g., UI states “All suspicious charges reviewed”):

  * \[ ] Provide an **edit/pencil icon** that lets the user:

    * \[ ] Edit transactions.
    * \[ ] Change their categories.

* \[ ] Ensure:

  * \[ ] Changes to a transaction’s category or suspicious status:

    * \[ ] Actually modify the underlying data.
    * \[ ] Update the counts of suspicious charges:

      * \[ ] In the popup.
      * \[ ] On the Review tab’s summary box.

---

### 3.8 Date Range Logic \& Debug Tool Behavior

* \[ ] Fix the **date range function in the debug tool**:

  * \[ ] It should represent the **date range the entire website is using for data**, not just what is currently being viewed.
  * \[ ] This is a **deep issue**.

* \[ ] Currently:

  * \[ ] The statements tab allows any date to be chosen, but it always shows basically **December 2 – December 16**.

* \[ ] Correct behavior:

  * \[ ] Reanalyze date logic so the **current date** becomes the default **statement end date**, unless overridden.
  * \[ ] The debug tool should be able to change the **stored** date range for the active dataset.

* \[ ] Distinguish two roles:

  * \[ ] **Statements page date dropdown**:

    * \[ ] Changes what is **viewed**.

  * \[ ] **Debug tool date range control**:

    * \[ ] Changes what is **stored** and regenerates/rewrites data as necessary.

  * \[ ] There should be **no visible difference** except:

    * \[ ] One is clearing/regenerating data (debug).
    * \[ ] One is just filtering what’s displayed (statements selector).

* \[ ] Remove **“Active test tab”** from the debug tool.

---

### 3.9 Math Logic \& Internal Transfers

* \[ ] Change **all math logic** wherever totals are computed, such that:

  * \[ ] Internal transfers are handled as **net** values:

    * \[ ] Money sent vs. money received.

  * \[ ] Transfers should **not** inflate deposits, credits, debits, or spending.

* \[ ] Apply this rule to:

  * \[ ] Net portfolio calculations.
  * \[ ] Total money spent.
  * \[ ] Money left after bills.
  * \[ ] Income/deposits.

* \[ ] Think through each metric:

  * \[ ] Decide explicitly whether transfers should:

    * \[ ] Be excluded from totals.
    * \[ ] Be shown separately.
    * \[ ] Be netted.

* \[ ] You may create a **dedicated math folder**:

  * \[ ] Centralize category math, transfer netting functions, and date-range calculations.
  * \[ ] Ensure all pages use this shared logic.

---

### 3.10 My Accounts Page (Previously “Accounts”)

* \[ ] Rename **Accounts** page to **“My Accounts”** in UI and routing (where appropriate).
* \[ ] Allow editing of **default preloaded accounts**:

  * \[ ] Edit account **name**.
  * \[ ] Edit **category/type** (Checking, Savings, MMSA, Roth, Loan, Credit Card, Mortgage, Auto Loan, etc.).
  * \[ ] Edit **balance** and the **balance date range** or assumptions.

* \[ ] Group accounts by **asset type**:

  * \[ ] Checking.
  * \[ ] Savings.
  * \[ ] MMSA.
  * \[ ] Roth / retirement.
  * \[ ] Loan.
  * \[ ] Credit Card.
  * \[ ] Mortgage.
  * \[ ] Auto loan.
  * \[ ] (Crypto and stocks should remain on separate dedicated pages, but still factor into net worth.)

* \[ ] Add two summary boxes under the main My Accounts section:

  * \[ ] **Total stock investment portfolio (net)**.
  * \[ ] **Total crypto investment portfolio (net)**.

* \[ ] Implement **Net Worth History**:

  * \[ ] Show a neatly formatted graph.
  * \[ ] Allow selectable time frames (e.g., 1M, 3M, 6M, 1Y).
  * \[ ] Underneath, list all accounts with:

    * \[ ] A circle toggle switch (on/off) per account.
    * \[ ] When toggled off, the account is excluded from net worth calculations.

  * \[ ] Stocks and crypto must also appear in net worth history toggles.

* \[ ] Clicking on the **stock** or **crypto** summary boxes:

  * \[ ] Should redirect to their respective detailed pages.

* \[ ] Provide an **account list editor**:

  * \[ ] Use dropdown arrows to expand groups with descriptions.
  * \[ ] Add a **Select/Deselect All** control at the bottom.

* \[ ] Add a **Savings Goal Calculator**:

  * \[ ] Fully implement savings goal functions at the bottom of the My Accounts page.
  * \[ ] When a savings goal is selected:

    * \[ ] Show a **progress bar** between “Balance by account type” and “All accounts”.
    * \[ ] The bar should display:

      * \[ ] Progress toward goal.
      * \[ ] “On track” or “Off track” status based on current date and contributions.

  * \[ ] When no savings goal is set up:

    * \[ ] Show an empty bar and a “Set up savings goal” button.
    * \[ ] Clicking the button automatically scrolls down to the goal setup area.

  * \[ ] Keep “Coming soon” text at the very bottom only if needed to hint at future features.

* \[ ] For connecting external accounts:

  * \[ ] Take the **purple “Connect your account”** element from the Review page.
  * \[ ] Replace the “Connect your bank box” on My Accounts with this purple element.
  * \[ ] When clicked:

    * \[ ] Show a popup with an X in top-right.
    * \[ ] Text like: “Coming soon – connect with Plaid.”

  * \[ ] Place this connect box directly **under My Accounts summary**.

* \[ ] Internal transfers list:

  * \[ ] The detailed list of all transfers (described in Internal Transfers section) should ultimately live on My Accounts, even if triggered from Review.

---

### 3.11 Stocks Page – Behavior \& Data

#### 3.11.1 Holdings Card Overlay Issue

* \[ ] On the Stocks page, when hovering over a holding:

  * \[ ] A trash can icon appears to delete that holding.
  * \[ ] Currently, it is displayed **on top of the stock price**.
  * \[ ] Adjust layout so the icon and price do not overlap.

#### 3.11.2 Stocks Search \& Relevance

* \[ ] Stocks search bar:

  * \[ ] When the search popup is opened:

    * \[ ] It should open as soon as the user clicks into it (not only after typing).
    * \[ ] Even with no text typed, it should show **relevant** suggestions:

      * \[ ] Popular stocks.
      * \[ ] Best performers.
      * \[ ] Recent user holdings (if appropriate).

  * \[ ] When the user types:

    * \[ ] Continue to show matches sorted by relevance.

* \[ ] Add a **“Browse all”** button:

  * \[ ] Opens a view that shows recommended or popular stocks.
  * \[ ] Group them by category (e.g., Tech, Blue Chips, ETFs).

* \[ ] Data constraints:

  * \[ ] Ideally, there is a **database of all stocks/ETFs** accessible.
  * \[ ] If not, implement a **very generous cap** of realistic tickers.

#### 3.11.3 Add-to-Portfolio Form

* \[ ] When adding a stock to portfolio (via search or an “Add” button):

  * \[ ] In the **Average Cost Per Share** field:

    * \[ ] Prepend or show a **$** sign.

  * \[ ] Add a **custom date purchased** field with an info bubble:

    * \[ ] Info bubble text: explains that the date helps track net worth history.

* \[ ] Before saving the stock:

  * \[ ] Provide a button to **add multiple purchase lots**:

    * \[ ] Each additional lot has:

      * \[ ] Share quantity.
      * \[ ] Price per share.
      * \[ ] Purchase date.

    * \[ ] Users can click to add new rows as many times as they need.

#### 3.11.4 Stock Detail Data

* \[ ] Stock detail section must include rich data similar to:

  * \[ ] NVIDIA Corporation (NVDA)
  * \[ ] Price 183.38
  * \[ ] +$3.79
  * \[ ] +(2.11%)
  * \[ ] At close: 4:00:00 PM EST
  * \[ ] $184.16
  * \[ ] +$0.78
  * \[ ] (+0.43%)
  * \[ ] Overnight: 11:49:08 PM EST
  * \[ ] Previous Close $179.59
  * \[ ] Open $181.57
  * \[ ] Bid $182.63 x 100
  * \[ ] Ask $183.27 x 100
  * \[ ] Day's Range $179.97 - 184.51
  * \[ ] 52 Week Range 86.62 - 212.19
  * \[ ] Volume 166,479,246
  * \[ ] Avg. Volume 191,223,562
  * \[ ] Market Cap (intraday) 4.465T
  * \[ ] Beta (5Y Monthly) 2.27
  * \[ ] PE Ratio (TTM) 45.39
  * \[ ] EPS (TTM) 4.04
  * \[ ] Earnings Date Nov 19, 2025
  * \[ ] Forward Dividend \& Yield 0.04 (0.02%)
  * \[ ] Ex-Dividend Date Dec 4, 2025
  * \[ ] 1y Target Est 250.66

* \[ ] Add `$` signs where appropriate and clean numeric formatting.
* \[ ] Add a link to **Motley Fool** article if available:

  * \[ ] Display it at the top of the news suggestions under that stock.

#### 3.11.5 Stock Comparison Feature

* \[ ] Add a **“Compare stocks”** feature:

  * \[ ] Button or clearly visible entry point.
  * \[ ] Allow users to select up to **three stocks**.
  * \[ ] Show a comparison table similar to the provided screenshot:

    * \[ ] Market value.
    * \[ ] Enterprise value.
    * \[ ] Price to earnings.
    * \[ ] Diluted EPS.
    * \[ ] Forward dividend \& yield.
    * \[ ] Sector, industry, CEO, etc.
    * \[ ] Price performance for 1 Week, 3 Months, YTD, 1 Year.
    * \[ ] Income statement basics.
    * \[ ] Balance sheet basics.

* \[ ] Overnight prices:

  * \[ ] Show overnight price separately and clearly labeled as such.
  * \[ ] Create a new ticker tab or view that shows only overnight price movements.

#### 3.11.6 Watchlist

* \[ ] Implement a **Watchlist**:

  * \[ ] Provide a button to add:

    * \[ ] Any stock.
    * \[ ] Any news article.

  * \[ ] Maintain **separate lists** for:

    * \[ ] Watched stocks.
    * \[ ] Watched news/articles.

  * \[ ] Ensure the library of watchable stocks is expanded via:

    * \[ ] Search.
    * \[ ] “Browse all” view.

---

### 3.12 Crypto Page – Mirroring Stocks with Crypto Data

* \[ ] Main problem: **no crypto information displayed**.

  * \[ ] Investigate current crypto API (likely CoinGecko).
  * \[ ] Determine if:

    * \[ ] The endpoint is broken.
    * \[ ] A key is now required.

  * \[ ] If necessary, note which key is needed so the user can supply it.
  * \[ ] If CoinGecko is too difficult, consider **Yahoo Finance** or another reliable source for crypto pricing and details.

* \[ ] Apply all **Stocks page improvements** analogously to the **Crypto page**, using crypto-appropriate data:

  * \[ ] Rich detail per coin (price, 24h change, market cap, volume, etc.).
  * \[ ] Search + browse with relevance.
  * \[ ] Add-to-portfolio with buy lots and dates.
  * \[ ] Crypto watchlist.

* \[ ] At the **bottom of the Crypto page**:

  * \[ ] Add the **Currency ↔ Crypto exchange** box:

    * \[ ] Show current estimated exchange rates.
    * \[ ] Show any fees or percentage spreads.
    * \[ ] Allow converting both ways and swapping “From”/“To”.

---

### 3.13 Review Tab – Logic, Layout, and Color

#### 3.13.1 Detected Accounts Relocation

* \[ ] Move the **Detected Accounts** UI from Review tab to My Accounts:

  * \[ ] Place under “My Accounts” box on the My Accounts page.

#### 3.13.2 Account Balances Box

* \[ ] On Review tab:

  * \[ ] Remove “Coming soon” in the **Account balances** box.
  * \[ ] Use actual data from:

    * \[ ] Generated statements.
    * \[ ] My Accounts page.

  * \[ ] Show:

    * \[ ] Checking.
    * \[ ] Savings.
    * \[ ] Investments (Crypto \& Stock).
    * \[ ] Debt:

      * \[ ] Hide actual number by default.
      * \[ ] Show as `XXXX.XX` until an eye icon is clicked to reveal.

* \[ ] At the bottom of the account balances box:

  * \[ ] Add text: **“Avg daily spending”** with the calculated value.

* \[ ] When a user clicks “Review” on Detected Accounts and selects **“Add account”**:

  * \[ ] Ensure it:

    * \[ ] Adds the account to the account balances section on Review.
    * \[ ] Adds the account to the accounts list on My Accounts.

#### 3.13.3 Overall Review Layout \& Color

* \[ ] At the top of Review:

  * \[ ] Increase the font size for text inside all **six boxes** so they’re easier to read.

* \[ ] Make each box section visually interesting:

  * \[ ] Add tasteful effects, colors, or subtle animations.

* \[ ] Tab color:

  * \[ ] The Review tab should be **deep purple, glassy**, matching the site’s theme.
  * \[ ] All tabs should have **good, popping colors** distinct from each other.
  * \[ ] Review tab should no longer be plain white.

#### 3.13.4 Subscriptions Box in Review

* \[ ] In the **Subscriptions** box on Review tab:

  * \[ ] “Tap to manage subscriptions” currently does nothing:

    * \[ ] Make it open a popup.
    * \[ ] Popup shows all subscription merchants separated into **expandable/collapsible** sections:

      * \[ ] One section per merchant.
      * \[ ] Include all merchants, even if suspicious.

  * \[ ] In this popup:

    * \[ ] If any merchant has suspicious charges:

      * \[ ] Place a `!` triangle next to the merchant’s header.
      * \[ ] Also place `!` next to each specific suspicious transaction line.

#### 3.13.5 Suspicious Charges Box (Renaming Duplicate Charges)

* \[ ] Rename “Duplicate charges” summary box on Review to **“Suspicious charges”**.
* \[ ] Replace text “with possible duplicates” with a more accurate description that covers:

  * \[ ] Duplicate charges.
  * \[ ] Overcharges.
  * \[ ] Unexpected charges.

* \[ ] When user opens suspicious charges to review and clicks **dismiss**:

  * \[ ] Ensure it:

    * \[ ] Updates the number displayed in the popup.
    * \[ ] Updates the number in the Review page box.

#### 3.13.6 Money Left After Bills

* \[ ] “Money left after bills” box:

  * \[ ] Display **Average monthly money left after bills**.

* \[ ] On click:

  * \[ ] Show a modal or popup with:

    * \[ ] A **histogram bar graph** of **month-by-month money left after bills**.
    * \[ ] Editable view (e.g., different date ranges).
    * \[ ] At top: the average monthly amount.
    * \[ ] Below: the **total money left** over the current selected/edited date range (based on statements tab date range).

* \[ ] Add a description explaining:

  * \[ ] What is and isn’t included, e.g.:

    * \[ ] IRAs? Crypto? Investments?
    * \[ ] These should **not** be included as “savings” by default.
    * \[ ] Net transfers should be considered properly.

* \[ ] Provide toggles (circle selectors) to:

  * \[ ] Optionally include or exclude:

    * \[ ] Crypto.
    * \[ ] Investments.
    * \[ ] Other categories.

  * \[ ] Including/excluding should update:

    * \[ ] The popup totals.
    * \[ ] The main Review box value.

#### 3.13.7 Internal Transfers Box

* \[ ] Internal transfers box should:

  * \[ ] Show **Total money sent out**.
  * \[ ] Show **Total money received**.
  * \[ ] Show **Net amount**.
  * \[ ] Display **number of transfers**.
  * \[ ] Display current date range in small gray text, always derived from:

    * \[ ] Default statement range or
    * \[ ] User-chosen statements date range.

* \[ ] When clicking the internal transfers box:

  * \[ ] Show list of all transfers organized as:

    * \[ ] Expandable month-by-month sections.

* \[ ] This detailed internal transfers list should eventually appear on My Accounts page as well.

#### 3.13.8 Needs vs Wants

* \[ ] Needs vs Wants section:

  * \[ ] Ensure that all updated math, transfer netting, and category assignments:

    * \[ ] Feed into Needs vs Wants logic.

  * \[ ] When it says “Saved this month”, confirm:

    * \[ ] It uses correct logic consistent with:

      * \[ ] Internal transfer netting.
      * \[ ] Income/spending categories.

---

### 3.14 Popups \& Under-Glow Effects

* \[ ] For all popup screens that appear when clicking special buttons:

  * \[ ] Add a slight **under-glow** behind the black glass background.
  * \[ ] The glow color should match the **current page/tab color**.
  * \[ ] Keep it subtle:

    * \[ ] Not super bloomy.
    * \[ ] More like a neon glow line around edges, or soft halo.

  * \[ ] In Phase 2, set up structure/classes.
  * \[ ] In Phase 3, tune the exact look.

---

## 4\. Phase 3 – Final Polish \& QA

### 4.1 Design \& Aesthetic Polish

* \[ ] Review **every tab** for:

  * \[ ] Consistent color palette.
  * \[ ] Glassmorphism and under-glow usage.
  * \[ ] Premium, non-bland, non-cartoonish look.

* \[ ] Refine:

  * \[ ] Dashboard summary cards.
  * \[ ] Overview pie chart styling.
  * \[ ] Review tab boxes and headings.
  * \[ ] My Accounts net worth graph and savings goal bar.
  * \[ ] Popup designs and transitions.

### 4.2 Interaction \& UX Testing

* \[ ] On **every page**, test:

  * \[ ] Clicks.
  * \[ ] Opens.
  * \[ ] Scroll behavior (especially on mobile).
  * \[ ] Drag interactions.
  * \[ ] Hover states.
  * \[ ] Keyboard focus where appropriate.

* \[ ] Confirm:

  * \[ ] All buttons open the correct popups.
  * \[ ] All X/close icons work.
  * \[ ] “Restart Demo” resets data and routing as expected.
  * \[ ] “Manage subscriptions”, “Review now”, “More info”, “Mark suspicious”, “All good”, etc. perform correctly.

### 4.3 Data \& Math Sanity Check

* \[ ] Validate across the entire app:

  * \[ ] Totals for spending, income, and net cashflow match underlying transactions, with transfers netted correctly.
  * \[ ] Money left after bills reflects:

    * \[ ] Correct date range from Statements.
    * \[ ] Inclusion/exclusion toggles (crypto, investments).

  * \[ ] Suspicious charges counts:

    * \[ ] Match the actual number of flagged transactions across pages.

  * \[ ] Needs vs Wants:

    * \[ ] Shows consistent savings logic and monthly “Saved this month” values.

* \[ ] Check that:

  * \[ ] Account balances in My Accounts, Review, and Dashboard align.
  * \[ ] Stock and crypto holdings feed properly into:

    * \[ ] Net worth history.
    * \[ ] Investment totals.

### 4.4 APIs \& Performance

* \[ ] Confirm all APIs:

  * \[ ] Respect implemented rate limits/debounces.
  * \[ ] Are not being spammed by unnecessary calls (especially search).
  * \[ ] Fail gracefully when keys are missing (show user-friendly messages).

* \[ ] Debug tool:

  * \[ ] Token counts per API per session display correctly.
  * \[ ] Rate limit status is accurate.

* \[ ] Performance:

  * \[ ] Page loads remain responsive.
  * \[ ] Heavy lists (statements, transactions) handle virtualization or pagination as needed.

### 4.5 Final Build \& Documentation

* \[ ] Run final commands:

  * \[ ] `npm run lint` (ensure clean).
  * \[ ] `npm run dev` smoke test for manual clicking around.
  * \[ ] `npm run build` for final verification.

* \[ ] Update `PLAN.md`:

  * \[ ] Check off completed items.
  * \[ ] Note any remaining issues that require user action (e.g., missing API keys, external service changes).
  * \[ ] Document any known edge cases or future improvement ideas.
