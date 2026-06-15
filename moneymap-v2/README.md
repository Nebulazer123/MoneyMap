# MoneyMap

MoneyMap is a local-first personal finance dashboard built with Next.js, React, TypeScript, Tailwind CSS, Zustand, Recharts, and server-side API routes.

The app demonstrates a full dashboard workflow for exploring spending, subscriptions, account balances, cashflow, budgets, market data, crypto prices, news, location-aware utility widgets, and statement upload flows. Demo data is generated locally so the project can be reviewed without connecting a real bank account.

## Features

- Dashboard views for overview, statement review, recurring transactions, fees, cashflow, budgets, subscriptions, and accounts.
- Stock and crypto dashboards backed by server-side API routes, caching, bounded request fanout, and graceful fallback states.
- Synthetic transaction generation with category rules, merchant pools, account types, and localStorage-backed state.
- Interactive charts and financial summaries with Recharts.
- Optional API-backed widgets for news, email verification, FRED economic data, location, exchange rates, and market data.
- Responsive glass-style interface with route-aware dashboard navigation.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
- Recharts
- Yahoo Finance, CoinGecko, Frankfurter, FRED, NewsAPI, and Abstract API integrations

## Getting Started

Install dependencies from the repository root:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

You can also work directly inside the app folder:

```bash
cd moneymap-v2
npm install
npm run dev
```

## Environment Variables

MoneyMap works without secrets by using demo data or free unauthenticated APIs where possible. These optional variables enable richer live data:

```bash
NEWS_API_KEY=
ABSTRACT_EMAIL_API_KEY=
FRED_API_KEY=
NEXT_PUBLIC_SHOW_DEBUG=
```

Set `NEXT_PUBLIC_SHOW_DEBUG=true` only in development if you want the debug panel.

## Scripts

From the repository root:

```bash
npm run dev
npm run build
npm run lint
npm run start
```

From `moneymap-v2`:

```bash
npm run dev
npm run build
npm run lint
npm run qa:bucketC
```

## Data And Privacy

Demo transactions are generated in the browser and stored in localStorage. Uploaded statement handling is local to the app experience; this project does not connect to a bank account or persist financial data to a hosted database.

External market, news, exchange-rate, and utility API calls are made through server-side routes and should not include personal financial data.

## Deployment

The included `vercel.json` points Vercel at the nested `moneymap-v2` app:

```json
{
  "framework": "nextjs",
  "installCommand": "npm install && cd moneymap-v2 && npm install",
  "buildCommand": "cd moneymap-v2 && npm run build",
  "outputDirectory": "moneymap-v2/.next"
}
```

## Repository Layout

```text
.
├── moneymap-v2/        # Next.js application
├── vercel.json         # Vercel deployment configuration
├── package.json        # Root convenience scripts
└── package-lock.json
```

## Security Notes

Do not commit API keys or `.env` files. If a key has ever been committed to repository history, rotate that key with its provider and rewrite repository history before treating it as private again.
