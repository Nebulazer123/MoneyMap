# Copilot Instructions for MoneyMap

## Project Overview

MoneyMap is a personal finance application built with Next.js App Router, TypeScript, and React. It helps users track and visualize their financial data.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages and layouts
│   ├── about/     # About page
│   ├── dashboard/ # Dashboard page
│   ├── layout.tsx # Root layout
│   └── page.tsx   # Home page
├── components/    # Reusable React components
│   └── NavBar.tsx # Navigation component
└── lib/           # Utility functions and data
    ├── dashboard/ # Dashboard-specific utilities
    └── fakeData.ts # Sample data (do not modify exports)
```

## Code Style Guidelines

### General Rules

- Write small, focused helper functions over large rewrites
- Keep code idiomatic for modern React and Next.js (client/server components, hooks)
- Use TypeScript strictly - avoid `any` types
- Follow existing Tailwind CSS patterns for styling consistency

### Component Guidelines

- Use functional components with hooks
- Prefer named exports for components
- Keep components focused on a single responsibility
- Use `"use client"` directive only when necessary

### Naming Conventions

- Use PascalCase for component files and names
- Use camelCase for functions, variables, and hooks
- Use kebab-case for CSS classes and route segments

## Constraints

**Do not modify:**
- `src/lib/fakeData.ts` exports
- Any localStorage key names or meanings
- Existing component props and public APIs (unless explicitly asked to refactor)

**Always:**
- Preserve existing Tailwind classes and layout patterns
- Keep changes surgical and minimal
- Test changes with `npm run lint` before committing

## Testing

When making changes:
1. Run `npm run lint` to check for linting errors
2. Run `npm run build` to ensure the build succeeds
3. Test in development with `npm run dev`

## Additional Notes

- When uncertain about existing behavior, avoid speculative changes and call out assumptions in comments
- If you cannot fit all required changes into a reasonable scope, say so clearly and stop instead of truncating
