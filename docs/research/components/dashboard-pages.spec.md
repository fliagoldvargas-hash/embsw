# Dashboard Pages Specification

## Overview
- **Target files:** `app/leaderboard/page.tsx`, `app/profile/page.tsx`
- **Screenshots:** `docs/design-references/wagmiswap-leaderboard-desktop.png`, `docs/design-references/wagmiswap-profile-desktop.png`
- **Interaction model:** static public dashboards with navigation links.

## Leaderboard
- Content container: width about `1120px`, top padding about `78px`.
- Hero headline: `Season Zero`, font about `68px`, weight `900`, negative letter spacing.
- Stats grid: 4 equal cards, gap `10px`, panel background `rgba(23, 23, 27, 0.88)`, border `rgb(52, 52, 58)`.
- Analytics grid: `1.6fr 1fr`, gap `14px`.
- XP table columns: rank, wallet, swaps, XP.
- Activity bars use green foreground over dark track.

## Profile
- Content width about `1080px`.
- Empty state panel: large bordered rounded panel, centered orb, heading `Connect your wallet`, helper copy, white button.

## Responsive
- Stats grid becomes two columns at tablet and one column on mobile.
- Analytics panels stack at tablet/mobile.
