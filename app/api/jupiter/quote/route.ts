import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_SLIPPAGE_BPS, JUPITER_API_BASE, SWAP_FEE_BPS } from "../../../lib/config";

const integerPattern = /^\d+$/;

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const inputMint = search.get("inputMint");
  const outputMint = search.get("outputMint");
  const amount = search.get("amount");
  const slippageBps = search.get("slippageBps") || String(DEFAULT_SLIPPAGE_BPS);

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json({ error: "inputMint, outputMint and amount are required." }, { status: 400 });
  }

  if (!integerPattern.test(amount) || !integerPattern.test(slippageBps)) {
    return NextResponse.json({ error: "amount and slippageBps must be integer strings." }, { status: 400 });
  }

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps,
    platformFeeBps: String(SWAP_FEE_BPS),
  });

  const headers: HeadersInit = { accept: "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }

  const response = await fetch(`${JUPITER_API_BASE}/quote?${params.toString()}`, {
    headers,
    next: { revalidate: 0 },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Jupiter quote failed.", details: data },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}
