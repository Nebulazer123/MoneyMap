# Phase 3 – Overview Spending Pie & Categories

## Overview
The "Spending by group" card has been polished to feature a **Full Pie Chart** and a **Premium Category Grid**.

## Visual Specification

### Chart
- **Type**: Full Pie (no donut hole).
- **Radius**: `outerRadius={140}`.
- **Padding**: Minimal `paddingAngle={1}` to separate slices subtly.
- **Interaction**: Slight opacity change on hover.

### Category Cards
- **Layout**: 2-column grid (`sm:grid-cols-2`) with `gap-3` spacing.
- **Styling**: 
  - Background: `bg-zinc-900/30` (Subtle).
  - Borders: `border-zinc-800/50`.
- **Content Hierarchy**:
  1. **Icon**: 32px circle, centered emoji.
  2. **Label**: `text-sm`, `font-medium`, `text-zinc-200`.
  3. **Metadata**: "X cats" count in `text-[10px]`, `tracking-wider`.
  4. **Value**: Percentage in `text-lg` Bold, Amount in `text-[11px]` Mono.
- **Active State**:
  - Glow effect `shadow-[0_0_15px]` + Border highlight.
  - Subtle background gradient matching group color.

## Components
- `src/components/dashboard/Overview.tsx`: Contains the PieChart and custom button grid.
- `src/lib/config.ts`: Source of truth for group metadata (colors, emojis).
