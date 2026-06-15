# Contributing

Thanks for taking time to improve MoneyMap. This project is a local-first Next.js demo, so contributions should keep the app easy to run without credentials and safe to inspect publicly.

## Development Setup

```bash
git clone https://github.com/Nebulazer123/MoneyMap.git
cd MoneyMap
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Branches And Pull Requests

1. Create a focused branch for your change.
2. Keep unrelated refactors out of the same pull request.
3. Update README or inline docs when behavior changes.
4. Include screenshots for visible UI changes.
5. Open a pull request using the project template.

## Quality Checks

Run these before opening a pull request:

```bash
npm run lint
npm run build
```

For data-generation changes, also run:

```bash
cd moneymap-v2
npm run qa:bucketC
```

## Security And Data

- Do not commit `.env.local`, API keys, access tokens, account data, statements, or other private financial records.
- Keep optional integrations graceful when provider keys are missing.
- Do not introduce real bank connectivity without a separate security and privacy review.
