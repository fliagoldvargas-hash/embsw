const EMBER_TOKEN_MINT = "6oGuFDbEeaSzTcvrmmd2MqfNYwHKXFoN7regcR22pump";
const EMBER_PUMPFUN_URL = "https://pump.fun/coin/6oGuFDbEeaSzTcvrmmd2MqfNYwHKXFoN7regcR22pump";
const EMBER_X_URL = "";
const EMBER_TELEGRAM_URL = "";

export const EMBER_TOKEN = {
  symbol: "EMBER",
  name: "Ember Swap",
  // Paste the pump.fun/Solana mint here after launch.
  mint: EMBER_TOKEN_MINT || process.env.NEXT_PUBLIC_EMBER_TOKEN_MINT || "",
  // Paste the pump.fun coin URL here after launch.
  pumpFunUrl: EMBER_PUMPFUN_URL || process.env.NEXT_PUBLIC_EMBER_PUMPFUN_URL || "",
  decimals: Number(process.env.NEXT_PUBLIC_EMBER_TOKEN_DECIMALS || 6),
  image: "/assets/ember-swap-logo.png",
  xUrl: EMBER_X_URL || process.env.NEXT_PUBLIC_EMBER_X_URL || "",
  telegramUrl: EMBER_TELEGRAM_URL || process.env.NEXT_PUBLIC_EMBER_TELEGRAM_URL || "",
};

export const EMBER_IS_LIVE = Boolean(EMBER_TOKEN.mint);
