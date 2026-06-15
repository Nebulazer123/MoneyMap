# MoneyMap

MoneyMap is a local-first personal finance dashboard demo built with Next.js, React, TypeScript, Tailwind CSS, Zustand, and Recharts.

It is designed to show a full finance-product experience without requiring a bank connection. The app generates realistic demo transactions in the browser, stores them in localStorage, and layers on dashboards for spending, cashflow, subscriptions, fees, budgets, stocks, crypto, news, and economic indicators.

## What It Does

- Tracks income, spending, net cashflow, subscriptions, recurring charges, bank fees, budgets, accounts, and category trends.
- Provides statement-style review flows for suspicious charges, internal transfers, duplicate handling, and monthly summaries.
- Includes stock and crypto dashboards with server-side API routes, caching, fallback data, and bounded request behavior.
- Uses local synthetic financial data so reviewers can explore the product without sharing real account data.
- Supports optional API-backed widgets for market news, FRED economic data, exchange rates, email validation, location utilities, and generated helper data.
- Ships with a responsive glass-style interface, route-aware sidebar navigation, and a development-only debug menu.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
- Recharts
- lucide-react
- Yahoo Finance, CoinGecko, Frankfurter, FRED, NewsAPI, and Abstract API integrations

## Quick Start

```bash
git clone https://github.com/Nebulazer123/MoneyMap.git
cd MoneyMap
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Next.js app lives in `moneymap-v2/`. The root `package.json` provides convenience scripts that run the app from the repository root.

## Optional API Keys

MoneyMap works without secrets. When keys are missing, the app uses demo data or graceful fallback responses where possible.

To enable richer live data locally:

```bash
cp moneymap-v2/.env.example moneymap-v2/.env.local
```

Then fill in any keys you want to use:

```bash
NEWS_API_KEY=
ABSTRACT_EMAIL_API_KEY=
FRED_API_KEY=
NEXT_PUBLIC_SHOW_DEBUG=false
```

Keep provider keys server-side. Do not rename these to `NEXT_PUBLIC_*` unless the value is intentionally safe to expose in the browser.

## Scripts

Run these from the repository root:

```bash
npm run dev      # Start the local development server
npm run build    # Build the production app
npm run start    # Start the built Next.js app
npm run lint     # Run ESLint
```

The app folder also includes a targeted QA helper:

```bash
cd moneymap-v2
npm run qa:bucketC
```

## Repository Layout

```text
.
|-- moneymap-v2/
|   |-- src/app/             # App Router pages and API routes
|   |-- src/components/      # Dashboard, layout, onboarding, and UI components
|   |-- src/lib/             # Data generation, stores, selectors, cache, and logic
|   `-- scripts/             # Local QA helpers
|-- package.json             # Root convenience scripts
|-- package-lock.json
|-- vercel.json              # Vercel build configuration for the nested app
`-- README.md
```

## Data And Privacy

MoneyMap does not connect to a bank account and does not persist financial data to a hosted database. Demo transactions are generated in the browser and saved to browser localStorage.

External market, news, exchange-rate, location, and utility requests are routed through server-side Next.js API routes. Do not send real personal financial data to these routes unless you have reviewed and extended the app for that use case.

## Deployment

The included `vercel.json` deploys the nested Next.js app:

```json
{
  "framework": "nextjs",
  "installCommand": "npm install && cd moneymap-v2 && npm install",
  "buildCommand": "cd moneymap-v2 && npm run build",
  "outputDirectory": "moneymap-v2/.next"
}
```

For Vercel, add optional environment variables in the project settings before deploying. Real `.env` files are intentionally ignored by git.

## Development Notes

- The app is demo-first and local-first; generated data is resettable from the UI.
- Optional API integrations should fail softly so the dashboard remains usable without keys.
- Run `npm run lint` and `npm run build` before publishing changes.
- Keep API keys, local database files, generated build output, and `.vercel/` state out of version control.

## Security

If an API key is ever committed to git history, rotate it with the provider before using it again. Removing a key from a later commit is not enough to make the old value private.
