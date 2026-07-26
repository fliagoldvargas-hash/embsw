import { NextResponse } from "next/server";
import { EMBER_TOKEN } from "../../../lib/token";

type DexPair = {
  dexId?: string;
  url?: string;
  priceUsd?: string;
  priceNative?: string;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  marketCap?: number;
  fdv?: number;
  pairCreatedAt?: number;
  baseToken?: { address?: string; name?: string; symbol?: string };
};

export const dynamic = "force-dynamic";

export async function GET() {
  if (!EMBER_TOKEN.mint) {
    return NextResponse.json({
      live: false,
      token: EMBER_TOKEN,
      stats: null,
    });
  }

  const response = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${EMBER_TOKEN.mint}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 20 },
  });

  const pairs = (await response.json().catch(() => [])) as DexPair[];
  const bestPair = Array.isArray(pairs)
    ? pairs
        .filter((pair) => pair.baseToken?.address === EMBER_TOKEN.mint || pair.priceUsd)
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
    : null;

  return NextResponse.json({
    live: true,
    token: EMBER_TOKEN,
    stats: bestPair
      ? {
          dexId: bestPair.dexId || null,
          dexUrl: bestPair.url || null,
          priceUsd: bestPair.priceUsd || null,
          priceNative: bestPair.priceNative || null,
          volume24h: bestPair.volume?.h24 || null,
          liquidityUsd: bestPair.liquidity?.usd || null,
          marketCap: bestPair.marketCap || bestPair.fdv || null,
          pairCreatedAt: bestPair.pairCreatedAt || null,
        }
      : null,
  });
}
