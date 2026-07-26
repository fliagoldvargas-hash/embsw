import { NextRequest, NextResponse } from "next/server";
import { JUPITER_API_BASE } from "../../../lib/config";

type SwapRequestBody = {
  quoteResponse?: unknown;
  userPublicKey?: string;
};

export async function POST(request: NextRequest) {
  const feeAccount = process.env.EMBER_FEE_ACCOUNT;

  if (!feeAccount) {
    return NextResponse.json(
      { error: "EMBER_FEE_ACCOUNT is required before swaps can be executed." },
      { status: 400 }
    );
  }

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

  const response = await fetch(`${JUPITER_API_BASE}/swap`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      quoteResponse: body.quoteResponse,
      userPublicKey: body.userPublicKey,
      feeAccount,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Jupiter swap build failed.", details: data },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}
