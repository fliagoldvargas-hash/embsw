# Ember Token Setup

When EMBER launches on pump.fun, update one file:

`app/lib/token.ts`

Paste the mint/CA and pump.fun URL here:

```ts
export const EMBER_TOKEN = {
  symbol: "EMBER",
  name: "Ember Swap",
  mint: "PASTE_TOKEN_MINT_HERE",
  pumpFunUrl: "PASTE_PUMPFUN_URL_HERE",
  decimals: 6,
  image: "/assets/ember-swap-logo.png",
  xUrl: "",
  telegramUrl: "",
};
```

After this change:

- the token card shows the real CA/mint
- the copy button copies the real CA
- the pump.fun button points to the real token
- the swap form unlocks EMBER Jupiter quotes/swaps
- price, market cap, volume, liquidity and Dex link are fetched from DexScreener
- pre-launch warnings disappear automatically

The listed swap tokens live in:

`app/lib/swap-tokens.ts`

Use that file to add or remove default tokens, update memecoin mints, or change token decimals. Users can also paste a custom mint directly from the token selector in the app.

Then commit and push to `main`; Vercel deploys automatically.

Do not add a platform fee unless we intentionally decide to do so later. Current fee config is `0`.
