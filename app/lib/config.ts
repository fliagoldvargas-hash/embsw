import { ORBIT_TOKEN } from "./token";

export const SOL_MINT = "So11111111111111111111111111111111111111112";

export const ORBIT_MINT = ORBIT_TOKEN.mint || process.env.NEXT_PUBLIC_ORBIT_TOKEN_MINT || process.env.NEXT_PUBLIC_EMBER_TOKEN_MINT || "";

export const ORBIT_DECIMALS = ORBIT_TOKEN.decimals || Number(process.env.NEXT_PUBLIC_ORBIT_TOKEN_DECIMALS || process.env.NEXT_PUBLIC_EMBER_TOKEN_DECIMALS || 6);

export const EMBER_MINT = ORBIT_MINT;

export const EMBER_DECIMALS = ORBIT_DECIMALS;

export const SWAP_FEE_BPS = 0;

export const DEFAULT_SLIPPAGE_BPS = Number(process.env.NEXT_PUBLIC_DEFAULT_SLIPPAGE_BPS || 50);

function resolveJupiterApiBase() {
  const configured = process.env.JUPITER_API_BASE?.trim();

  if (!configured || configured.includes("quote-api.jup.ag")) {
    return "https://lite-api.jup.ag/swap/v1";
  }

  return configured.replace(/\/$/, "");
}

export const JUPITER_API_BASE = resolveJupiterApiBase();

export function requireConfiguredToken() {
  if (!ORBIT_MINT) {
    throw new Error("NEXT_PUBLIC_ORBIT_TOKEN_MINT is required before official Orbit token swaps can be enabled.");
  }

  return ORBIT_MINT;
}
