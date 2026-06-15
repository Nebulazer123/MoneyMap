# Security Policy

## Supported Versions

MoneyMap is maintained from the `main` branch. Security fixes should target the latest public commit.

| Version | Supported |
|---------|-----------|
| `main` | Yes |

## Reporting A Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

If GitHub private vulnerability reporting is enabled for this repository, use that channel. Otherwise, contact the repository owner privately before disclosing details publicly.

Manual review required before broad public use: add a monitored security email or another private reporting channel here.

## What To Include

- Affected route, component, or file path
- Steps to reproduce
- Expected impact
- Relevant screenshots, logs, or proof of concept
- Whether any API key, credential, or private financial data could be exposed

## Security Notes

- Do not commit API keys, credentials, statements, or real personal financial data.
- Keep provider keys in `.env.local` locally or in deployment environment variables.
- Do not expose secrets with a `NEXT_PUBLIC_` prefix.
- Treat real bank integrations as out of scope until the project has a dedicated security review.
