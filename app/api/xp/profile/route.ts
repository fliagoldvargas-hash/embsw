import { PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";
import { getWalletXpSummary } from "../../../lib/xp";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet")?.trim();

  if (!wallet) {
    return NextResponse.json({ error: "wallet is required." }, { status: 400 });
  }

  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: "Invalid Solana wallet address." }, { status: 400 });
  }

  try {
    const summary = await getWalletXpSummary(wallet);
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({
      wallet,
      totalXp: 0,
      totalSwaps: 0,
      todaySwaps: 0,
      activeDays: 0,
      lastSwapAt: null,
      warning: "XP storage is not available right now.",
    });
  }
}
