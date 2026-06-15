# MoneyMap App

This folder contains the Next.js application for MoneyMap. For the public project overview, start with the repository [README](../README.md).

## Local Development

From the repository root:

```bash
npm install
npm run dev
```

Or from this folder:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

The app runs without API keys. To enable optional live integrations, copy the example file:

```bash
cp .env.example .env.local
```

Supported variables:

```bash
NEWS_API_KEY=
ABSTRACT_EMAIL_API_KEY=
FRED_API_KEY=
NEXT_PUBLIC_SHOW_DEBUG=false
```

Provider keys should stay server-side. Do not expose them with a `NEXT_PUBLIC_` prefix.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run qa:bucketC
```

## Source Map

```text
src/app/             App Router pages and API routes
src/components/      Dashboard, layout, onboarding, and reusable UI
src/lib/             Stores, data generation, selectors, cache, and finance logic
scripts/             Local QA helpers
```

## Notes

- Demo transactions are generated locally and stored in browser localStorage.
- API-backed widgets should keep fallback behavior so the dashboard remains reviewable without keys.
- Keep `.env.local`, `.next/`, `.vercel/`, and other generated files out of git.
