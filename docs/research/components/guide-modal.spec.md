# Guide Modal Specification

## Overview
- **Target file:** `app/components/SwapExperience.tsx`
- **Screenshot:** `docs/design-references/wagmiswap-desktop-full.png`
- **Interaction model:** first-load modal, close button, CTA close.

## Computed Styles
- Backdrop: position `fixed`, inset viewport, z-index `20`, background `rgba(0, 0, 0, 0.74)`, display `grid`, padding `16px`.
- Modal card: width about `470px`, radius `17px`, background `rgb(23, 23, 27)`, border `1px solid rgb(59, 59, 66)`, padding about `30px 24px 24px`.
- Step cards: border `1px solid rgb(52,52,58)`, radius `10px`, two-column number/content layout.
- Number badge: green square `30px`, radius `9px`.
- Warning: amber text on `rgb(34, 31, 21)`, left border `rgb(251, 191, 36)`.

## Text Content
- `60-SECOND GUIDE`
- `Know before you swap`
- Three numbered safety/account-rent items.
- `GOT IT - START SMALL`
