# MoneyMap

MoneyMap is a local-first personal finance dashboard built with Next.js, React, TypeScript, Tailwind CSS, Zustand, and Recharts.

It includes synthetic transaction generation, dashboard analytics, statement review flows, stock and crypto watchlists, market widgets, and public API integrations through server-side Next.js routes.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The application source lives in `moneymap-v2/`. Root scripts are convenience wrappers around that app.

## Common Commands

```bash
npm run lint
npm run build
npm run start
```

## Optional Environment Variables

MoneyMap runs without secrets, but these optional variables enable richer live data:

```bash
NEWS_API_KEY=
ABSTRACT_EMAIL_API_KEY=
FRED_API_KEY=
NEXT_PUBLIC_SHOW_DEBUG=
```

Set `NEXT_PUBLIC_SHOW_DEBUG=true` only in development.

## Project Notes

- Demo financial data is generated locally and stored in browser localStorage.
- Market and utility integrations are accessed through server-side API routes.
- The app is configured for Vercel with the nested `moneymap-v2` app as the build target.
- API keys and `.env` files should never be committed.

For more details, see [moneymap-v2/README.md](moneymap-v2/README.md).
