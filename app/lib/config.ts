import { EMBER_TOKEN } from "./token";

export const SOL_MINT = "So11111111111111111111111111111111111111112";

export const EMBER_MINT = EMBER_TOKEN.mint || process.env.NEXT_PUBLIC_EMBER_TOKEN_MINT || "";

export const EMBER_DECIMALS = EMBER_TOKEN.decimals || Number(process.env.NEXT_PUBLIC_EMBER_TOKEN_DECIMALS || 6);

export const SWAP_FEE_BPS = 0;

export const DEFAULT_SLIPPAGE_BPS = Number(process.env.NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS || 50);

export const JUPITER_API_BASE = process.env.JUPITER_API_BASE || "https://lite-api.jup.ag/swap/v1";

export function requireConfiguredToken() {
  if (!EMBER_MINT) {
    throw new Error("NEXT_PUBLIC_EMBER_TOKEN_MINT is required before real swaps can be enabled.");
  }

  return EMBER_MINT;
}
