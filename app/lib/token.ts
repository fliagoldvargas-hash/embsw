const EMBER_TOKEN_MINT = "8LwRzeJxqMobxjWsH5en4uV1S62Ni7FPyq8mK22Tpump";
const EMBER_PUMPFUN_URL = "https://pump.fun/coin/8LwRzeJxqMobxjWsH5en4uV1S62Ni7FPyq8mK22Tpump";
const EMBER_LAUNCH_AT = "2026-07-28T18:00:00-03:00";
const EMBER_X_URL = "";
const EMBER_TELEGRAM_URL = "";

export const EMBER_TOKEN = {
  symbol: "EMBER",
  name: "Ember Swap",
  // Paste the pump.fun/Solana mint here after launch.
  mint: EMBER_TOKEN_MINT || process.env.NEXT_PUBLIC_EMBER_TOKEN_MINT || "",
  // Paste the pump.fun coin URL here after launch.
  pumpFunUrl: EMBER_PUMPFUN_URL || process.env.NEXT_PUBLIC_EMBER_PUMPFUN_URL || "",
  // Set when both the CA and pump.fun URL go live. Example: "2026-07-26T00:00:00.000Z".
  launchAt: EMBER_LAUNCH_AT || process.env.NEXT_PUBLIC_EMBER_LAUNCH_AT || "",
  decimals: Number(process.env.NEXT_PUBLIC_EMBER_TOKEN_DECIMALS || 6),
  image: "/assets/ember-swap-logo.png",
  xUrl: EMBER_X_URL || process.env.NEXT_PUBLIC_EMBER_X_URL || "",
  telegramUrl: EMBER_TELEGRAM_URL || process.env.NEXT_PUBLIC_EMBER_TELEGRAM_URL || "",
};

export const EMBER_IS_LIVE = Boolean(EMBER_TOKEN.mint && EMBER_TOKEN.pumpFunUrl);
