import { getMint } from "@solana/spl-token";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";

const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta");

type JupiterToken = {
  id?: string;
  address?: string;
  mint?: string;
  name?: string;
  symbol?: string;
  icon?: string;
  logoURI?: string;
  decimals?: number;
  isVerified?: boolean;
  tags?: string[];
  launchpad?: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ error: "query is required." }, { status: 400 });
  }

  let mint: PublicKey;

  try {
    mint = new PublicKey(query);
  } catch {
    return NextResponse.json({ error: "Paste a valid Solana token mint / CA." }, { status: 400 });
  }

  const jupiterToken = await fetchJupiterToken(mint.toBase58());

  if (jupiterToken) {
    return NextResponse.json({
      symbol: normalizeSymbol(jupiterToken.symbol),
      name: jupiterToken.name || normalizeSymbol(jupiterToken.symbol) || "Custom token",
      mint: mint.toBase58(),
      decimals: Number.isFinite(jupiterToken.decimals) ? jupiterToken.decimals : 6,
      image: normalizeImageUrl(jupiterToken.icon || jupiterToken.logoURI),
      tags: buildTags(jupiterToken),
      note: jupiterToken.isVerified ? "Verified by Jupiter" : "Jupiter indexed",
    });
  }

  try {
    const connection = new Connection(endpoint, "confirmed");
    const mintInfo = await getMint(connection, mint);

    return NextResponse.json({
      symbol: "CUSTOM",
      name: "Custom token",
      mint: mint.toBase58(),
      decimals: mintInfo.decimals,
      tags: ["custom"],
      note: "On-chain mint",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load token metadata.",
        details: error instanceof Error ? error.message : "Token lookup failed.",
      },
      { status: 404 }
    );
  }
}

async function fetchJupiterToken(mint: string) {
  const headers: HeadersInit = { accept: "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }

  const response = await fetch(`https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(mint)}`, {
    headers,
    next: { revalidate: 3600 },
  }).catch(() => null);

  if (!response?.ok) return null;

  const data = (await response.json().catch(() => null)) as JupiterToken[] | null;
  const exact = data?.find((token) => (token.id || token.address || token.mint) === mint);
  return exact || data?.[0] || null;
}

function normalizeSymbol(symbol?: string) {
  const value = symbol?.trim();
  if (!value) return "CUSTOM";
  return value.length <= 12 ? value.toUpperCase() : value.slice(0, 12).toUpperCase();
}

function normalizeImageUrl(url?: string) {
  if (!url) return undefined;
  return url.replace(/^Https:\/\//, "https://").trim();
}

function buildTags(token: JupiterToken) {
  const tags = new Set<string>();

  if (token.isVerified) tags.add("verified");
  if (token.launchpad) tags.add(token.launchpad);
  token.tags?.slice(0, 2).forEach((tag) => tags.add(tag));

  return Array.from(tags).slice(0, 3);
}
