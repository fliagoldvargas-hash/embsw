const GM_TOKEN_MINT = "3CUskmyBA7Mw21BhnUwJ3PEKLA26boCm7feMR7Hwpump";
const GM_PUMPFUN_URL = "https://pump.fun/coin/3CUskmyBA7Mw21BhnUwJ3PEKLA26boCm7feMR7Hwpump";
const GM_LAUNCH_AT = "";
const GM_X_URL = "https://x.com/Gmswap_";
const GM_TELEGRAM_URL = "";

export const GM_TOKEN = {
  symbol: "GM",
  name: "GM SWAP",
  // Paste the pump.fun/Solana mint here after launch.
  mint: GM_TOKEN_MINT || process.env.NEXT_PUBLIC_GM_TOKEN_MINT || process.env.NEXT_PUBLIC_ORBIT_TOKEN_MINT || process.env.NEXT_PUBLIC_EMBER_TOKEN_MINT || "",
  // Paste the pump.fun coin URL here after launch.
  pumpFunUrl: GM_PUMPFUN_URL || process.env.NEXT_PUBLIC_GM_PUMPFUN_URL || process.env.NEXT_PUBLIC_ORBIT_PUMPFUN_URL || process.env.NEXT_PUBLIC_EMBER_PUMPFUN_URL || "",
  // Set when both the CA and pump.fun URL go live. Example: "2026-07-26T00:00:00.000Z".
  launchAt: GM_LAUNCH_AT || process.env.NEXT_PUBLIC_GM_LAUNCH_AT || process.env.NEXT_PUBLIC_ORBIT_LAUNCH_AT || process.env.NEXT_PUBLIC_EMBER_LAUNCH_AT || "",
  decimals: Number(process.env.NEXT_PUBLIC_GM_TOKEN_DECIMALS || process.env.NEXT_PUBLIC_ORBIT_TOKEN_DECIMALS || process.env.NEXT_PUBLIC_EMBER_TOKEN_DECIMALS || 6),
  image: "/assets/gm-swap-logo.png",
  xUrl: GM_X_URL || process.env.NEXT_PUBLIC_GM_X_URL || process.env.NEXT_PUBLIC_ORBIT_X_URL || process.env.NEXT_PUBLIC_EMBER_X_URL || "",
  telegramUrl: GM_TELEGRAM_URL || process.env.NEXT_PUBLIC_GM_TELEGRAM_URL || process.env.NEXT_PUBLIC_ORBIT_TELEGRAM_URL || process.env.NEXT_PUBLIC_EMBER_TELEGRAM_URL || "",
};

export const GM_IS_LIVE = Boolean(GM_TOKEN.mint && GM_TOKEN.pumpFunUrl);

export const ORBIT_TOKEN = GM_TOKEN;
export const ORBIT_IS_LIVE = GM_IS_LIVE;
export const EMBER_TOKEN = ORBIT_TOKEN;
export const EMBER_IS_LIVE = ORBIT_IS_LIVE;
