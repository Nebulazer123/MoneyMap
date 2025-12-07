# Phase 3 – Overview "Spending Pie" Polish Specification

**Last Updated:** 2025-12-07  
**Theme Name:** Onyx Gem Wheel  
**Objective:** Premium, clean pie chart with no center text, richer colors, and depth effects.

---

## Theme: Onyx Gem Wheel

High-contrast, vibrant colors designed to pop on dark backgrounds with gem-like depth.

### Color Palette

| Group | Color | Hex | Name |
|-------|-------|-----|------|
| Rent & Utilities | 🟠 | `#f97316` | Ember Orange |
| Stores & Dining | 🔵 | `#06b6d4` | Cyan Brilliant |
| Auto | 🔵 | `#3b82f6` | Sapphire Blue |
| Subscriptions | 🟣 | `#a855f7` | Vivid Purple |
| Insurance | 🟢 | `#22c55e` | Emerald Green |
| Bills & Services | 🟣 | `#6366f1` | Indigo Glow |
| Online Shopping | 🟣 | `#c026d3` | Magenta Pulse |
| Transfers | 🟡 | `#eab308` | Gold Stream |
| Other/Fees | 🔴 | `#f43f5e` | Rose Fire |

---

## Visual Implementation

### Clean Wheel (No Center Text)
- Removed "TOTAL SPENDING" overlay
- Pie is a pure, unobstructed disc

### Gradient Style
- **Type:** Linear gradient (diagonal, top-left to bottom-right)
- **Stops:** 100% → 85% → 65% opacity
- Creates gem-like beveled appearance

### Outer Glow
- Dual drop-shadow: `drop-shadow(0 0 20px rgba(99, 102, 241, 0.15)) drop-shadow(0 8px 32px rgba(0, 0, 0, 0.4))`
- Indigo tint inner glow + deep shadow

### Hover States
- **Active:** `brightness(1.1) saturate(1.15)` - brighter and more vivid
- **Inactive:** `brightness(0.5) saturate(0.7)` - strong dimming
- Smooth 300ms transitions

### Tooltip
- Slice-colored border (`data.color + '40'`)
- Larger padding (p-4) and font sizes
- "X% of total spending" text

---

## Files Modified

- `src/lib/config.ts` - Onyx Gem Wheel palette
- `src/components/dashboard/Overview.tsx` - Pie styling, gradients, hover, tooltip

---

## QA Checklist

- [x] No text overlays on pie
- [x] Vibrant colors visible
- [x] Linear gradients create depth
- [x] Outer glow visible
- [x] Hover brightens active slice
- [x] Inactive slices dim strongly
- [x] Legend dots match slice colors
- [x] Tooltip has slice-colored border
- [x] Build passes

**Build Status:** ✅ `npm run build` exits 0
