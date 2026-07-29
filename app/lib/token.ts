const ORBIT_TOKEN_MINT = "";
const ORBIT_PUMPFUN_URL = "";
const ORBIT_LAUNCH_AT = "";
const ORBIT_X_URL = "https://x.com/Orbitswap_";
const ORBIT_TELEGRAM_URL = "";

export const ORBIT_TOKEN = {
  symbol: "ORBIT",
  name: "Orbit Swap",
  // Paste the pump.fun/Solana mint here after launch.
  mint: ORBIT_TOKEN_MINT || process.env.NEXT_PUBLIC_ORBIT_TOKEN_MINT || process.env.NEXT_PUBLIC_EMBER_TOKEN_MINT || "",
  // Paste the pump.fun coin URL here after launch.
  pumpFunUrl: ORBIT_PUMPFUN_URL || process.env.NEXT_PUBLIC_ORBIT_PUMPFUN_URL || process.env.NEXT_PUBLIC_EMBER_PUMPFUN_URL || "",
  // Set when both the CA and pump.fun URL go live. Example: "2026-07-26T00:00:00.000Z".
  launchAt: ORBIT_LAUNCH_AT || process.env.NEXT_PUBLIC_ORBIT_LAUNCH_AT || process.env.NEXT_PUBLIC_EMBER_LAUNCH_AT || "",
  decimals: Number(process.env.NEXT_PUBLIC_ORBIT_TOKEN_DECIMALS || process.env.NEXT_PUBLIC_EMBER_TOKEN_DECIMALS || 6),
  image: "/assets/orbit-swap-logo.png",
  xUrl: ORBIT_X_URL || process.env.NEXT_PUBLIC_ORBIT_X_URL || process.env.NEXT_PUBLIC_EMBER_X_URL || "",
  telegramUrl: ORBIT_TELEGRAM_URL || process.env.NEXT_PUBLIC_ORBIT_TELEGRAM_URL || process.env.NEXT_PUBLIC_EMBER_TELEGRAM_URL || "",
};

export const ORBIT_IS_LIVE = Boolean(ORBIT_TOKEN.mint && ORBIT_TOKEN.pumpFunUrl);

export const EMBER_TOKEN = ORBIT_TOKEN;
export const EMBER_IS_LIVE = ORBIT_IS_LIVE;
