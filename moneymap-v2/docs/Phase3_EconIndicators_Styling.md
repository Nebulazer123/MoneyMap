# Phase 3 – Economic Indicators Styling Specification

**Last Updated:** 2025-12-07  
**Theme Name:** Macro Pulse Tiles  
**Objective:** Transform the Economic Indicators widget from plain dark boxes into a cohesive, colorful macro dashboard panel.

---

## Theme: Macro Pulse Tiles

The "Macro Pulse Tiles" design gives each economic indicator its own distinct visual identity while maintaining cohesion with the MoneyMap glass UI aesthetic. Each tile features:

- Unique accent color + gradient background
- Contextual icon representing the metric
- Large, scannable primary value
- Optional status badge based on thresholds
- Subtle hover effects

---

## Color Palette & Configuration

| Metric | Accent Color | Gradient | Icon | Badge Thresholds |
|--------|--------------|----------|------|------------------|
| **Fed Funds Rate** | Cyan (`#22d3ee`) | `from-cyan-950/40 via-cyan-900/20 to-zinc-900/40` | TrendingUp | ≥5% = "Elevated", ≥3% = "Normal", <3% = "Low" |
| **Inflation (CPI)** | Amber (`#fbbf24`) | `from-amber-950/40 via-amber-900/20 to-zinc-900/40` | BarChart3 | None (index value) |
| **Unemployment** | Violet (`#a78bfa`) | `from-violet-950/40 via-violet-900/20 to-zinc-900/40` | Briefcase | ≥6% = "Elevated", ≥4% = "Normal", <4% = "Low" |
| **10-Year Treasury** | Teal (`#2dd4bf`) | `from-teal-950/40 via-teal-900/20 to-zinc-900/40` | LineChart | ≥4.5% = "High", ≥3% = "Normal", <3% = "Low" |

---

## Badge Styling

| Tone | Background | Text | Border |
|------|------------|------|--------|
| Elevated | `bg-rose-500/20` | `text-rose-300` | `border-rose-500/30` |
| Normal | `bg-emerald-500/20` | `text-emerald-300` | `border-emerald-500/30` |
| Low | `bg-sky-500/20` | `text-sky-300` | `border-sky-500/30` |

---

## Visual Implementation Details

### Tile Structure
Each `IndicatorCard` component contains:
1. **Icon container** (10x10 rounded-xl with tinted background)
2. **Badge** (top-right, optional based on metric type)
3. **Value** (3xl font, accent-colored)
4. **Label** (sm font, zinc-300)
5. **Updated date** (xs font, zinc-500, with dot indicator)

### Gradient Treatment
- Each tile uses a 3-stop radial gradient from deep accent → mid accent → zinc
- Gradient direction: `bg-gradient-to-br` (bottom-right)
- Opacity: 40% outer, 20% mid, 40% inner for depth

### Hover Effects
- Border opacity increases on hover
- Subtle box shadow appears (`shadow-lg shadow-black/20`)
- Inner glow overlay fades in (`from-white/5 via-transparent`)

### Layout
- **Desktop:** 4-column grid (`lg:grid-cols-4`)
- **Tablet:** 2-column grid (`sm:grid-cols-2`)
- **Mobile:** Single column (default)
- Gap: `gap-4` (1rem)

---

## Header & Footer

### Header
- Blue gradient icon container with `BarChart3` icon
- Title: "Economic Indicators"
- Subtitle: "Macro market pulse"
- Refresh button with loading spinner

### Footer
- Left: Data source attribution (FRED or Demo disclaimer)
- Right: "Updated [time]" timestamp
- Demo mode shows amber alert icon, live mode shows green check

---

## Files Modified

- `src/components/dashboard/EconomicWidget.tsx` - Complete component redesign

---

## QA Checklist

- [ ] 4 tiles visible with distinct accent colors
- [ ] Each tile shows: icon, value, label, date
- [ ] Badges appear on Fed Funds, Unemployment, Treasury (not CPI)
- [ ] Hover effects work smoothly on each tile
- [ ] Header shows "Economic Indicators" with refresh button
- [ ] Footer shows demo/FRED attribution + last updated time
- [ ] Layout adapts properly: 4 cols (desktop) → 2 cols (tablet) → 1 col (mobile)
- [ ] Values format correctly (% for rates, decimal for CPI index)

---

## Build Status

```
npm run build: ✅ Exit code 0
```
