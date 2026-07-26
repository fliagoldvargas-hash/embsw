# Home Swap Specification

## Overview
- **Target file:** `app/components/SwapExperience.tsx`
- **Screenshots:** `docs/design-references/wagmiswap-desktop-full.png`, `docs/design-references/clone-home-desktop-closed.png`
- **Interaction model:** modal, clipboard, flip control, external links.

## Extracted Geometry
- Hero starts below the 76px nav and is about `326px` tall.
- Official token panel: x `220`, y `420`, width `1000`, height `153`, padding `18px 20px`, radius `15px`.
- Swap shell: x `474`, y `611`, width `492`, height `577`, padding `22px`, radius `18px`.

## Styles
- Official panel background: `linear-gradient(125deg, rgba(183, 255, 54, 0.12), rgb(18, 18, 22) 48%, rgba(139, 92, 246, 0.08))`.
- Swap shell background: `linear-gradient(145deg, rgba(26, 26, 30, 0.97), rgba(13, 13, 16, 0.98))`.
- Swap shell shadow: `rgba(0,0,0,.55) 0 35px 100px`, outer `rgba(255,255,255,.016) 0 0 0 7px`.
- CTA buttons: green `rgb(183, 255, 54)`, radius `10px`, min-height `56px`, inset bottom shadow.

## Text Content
- Headline: `Swap fast. Stay unhinged.`
- Token: `WAGMI Swap`, price `$0.00000618`, market cap `$6,185`, 24H volume `$26,357`.
- Contract: `4rwFTvBQzyYEHWUyTxW4xL7i6Wzumxo3YZgrbED6pump`.

## Behaviors
- Guide opens/closes.
- Copy button writes contract.
- Flip swaps SOL/WAGMI labels.
- Hover transitions translate buttons by about `-1px`.
