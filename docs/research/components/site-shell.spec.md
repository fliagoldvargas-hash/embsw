# SiteShell Specification

## Overview
- **Target file:** `app/components/SiteShell.tsx`
- **Screenshots:** `docs/design-references/wagmiswap-*-desktop.png`
- **Interaction model:** static navigation with hover transitions and internal links.

## Computed Styles
- Nav: height `76px`, padding `0px 72px`, display `grid`, background `rgba(8, 8, 10, 0.78)`, border-bottom `1px solid rgb(36, 36, 40)`.
- Brand: font `18px/Manrope`, weight `800`, letter-spacing `-0.72px`, mascot `43px` circle.
- Nav link: font `11px`, color `rgb(133, 133, 142)`, height `42px`, padding `0 12px`.
- Profile button: height `42px`, border `1px solid rgb(52, 52, 58)`, radius `8px`, background `rgb(23, 23, 27)`.
- Wallet button: height `42px`, radius `8px`, background `rgb(244, 244, 245)`, color `rgb(17, 17, 17)`, weight `800`.

## Assets
- `public/assets/wagmi-mascot.webp`
- `public/assets/wagmi.svg`

## Responsive
- Desktop is three-column grid.
- Tablet/mobile wraps to a stacked nav with horizontal actions.
