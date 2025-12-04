# InfoTooltip Fix Verification

## Issue
Tooltips were being cut off by the `overflow: hidden` property of the `GlassCard` components.

## Fix
- Refactored `InfoTooltip` to use `React.createPortal`.
- This renders the tooltip directly into `document.body`, ensuring it floats above all other elements and is not constrained by parent overflow settings.
- Added explanatory tooltips to "Top Categories" and "Needs vs Wants" sections as requested.

## Verification
- The tooltip now renders with `fixed` positioning relative to the viewport, ensuring visibility.
- Verified via code review and browser interaction test.
