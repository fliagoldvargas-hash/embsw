import { NextRequest, NextResponse } from "next/server";
import { JUPITER_API_BASE, SWAP_FEE_BPS } from "../../../lib/config";

type SwapRequestBody = {
  quoteResponse?: unknown;
  userPublicKey?: string;
};

export async function POST(request: NextRequest) {
  const feeAccount = SWAP_FEE_BPS > 0 ? process.env.GM_FEE_ACCOUNT || process.env.ORBIT_FEE_ACCOUNT || process.env.EMBER_FEE_ACCOUNT : "";

  const body = (await request.json().catch(() => null)) as SwapRequestBody | null;

  if (!body?.quoteResponse || !body.userPublicKey) {
    return NextResponse.json(
      { error: "quoteResponse and userPublicKey are required." },
      { status: 400 }
    );
  }

  const headers: HeadersInit = {
    accept: "application/json",
    "content-type": "application/json",
  };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }

  const swapBody: Record<string, unknown> = {
    quoteResponse: body.quoteResponse,
    userPublicKey: body.userPublicKey,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    dynamicSlippage: false,
    skipUserAccountsRpcCalls: false,
    prioritizationFeeLamports: {
      priorityLevelWithMaxLamports: {
        priorityLevel: "high",
        maxLamports: 500000,
      },
    },
  };

  if (feeAccount) {
    swapBody.feeAccount = feeAccount;
  }

  let response: Response;

  try {
    response = await fetch(`${JUPITER_API_BASE}/swap`, {
      method: "POST",
      headers,
      body: JSON.stringify(swapBody),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not reach Jupiter swap API.",
        details: error instanceof Error ? error.message : "Network request failed.",
        apiBase: JUPITER_API_BASE,
      },
      { status: 502 }
    );
  }

  const raw = await response.text();
  const data = parseJson(raw);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Jupiter swap build failed.", details: data },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}

function parseJson(value: string) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return { raw: value.slice(0, 500) };
  }
}
