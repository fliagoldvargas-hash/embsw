# WAGMI Swap Behaviors

## Routes
- `/`: swap screen with token summary, swap form, footer, floating guide trigger, and guide modal.
- `/leaderboard`: public Season Zero analytics dashboard.
- `/profile`: public wallet profile empty state.

## Global
- Top navigation is fixed-height at 76px on desktop, translucent black, blurred, with hover color/translate transitions on links and buttons.
- Background is dark with a subtle 96px grid and green radial glow centered behind page content.
- Fonts: Manrope for UI text; DM Mono for labels, tiny captions, footer, table labels, and status text.
- Primary accent: `rgb(183, 255, 54)`.

## Home Interactions
- `How it works` fixed pill opens the guide modal.
- Guide modal is visible on first load in the captured reference. It closes via the `x` button or `GOT IT - START SMALL`.
- Modal backdrop darkens the page and the underlying home content is blurred while open.
- `COPY CONTRACT` writes the WAGMI contract to the clipboard and temporarily changes to `COPIED`.
- Flip button swaps displayed pay/receive token labels and uses a rotate hover transition.
- External links open in a new tab: Pump.fun token and GitHub source.

## Dashboard Interactions
- Navigation links route internally between `/`, `/leaderboard`, and `/profile`.
- Dashboard cards have static data in the captured public state.
- Profile page wallet action is mocked visually as the original public unauthenticated state.

## Responsive
- Desktop uses the extracted 1120px dashboard width, 1000px token card width, and 492px swap card width.
- At tablet widths, token/dashboard grids collapse while preserving panel styling.
- At mobile widths, nav wraps, grid spacing tightens, and stat cards stack to one column.
