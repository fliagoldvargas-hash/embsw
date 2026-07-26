import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, clusterApiUrl, type ParsedAccountData } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";
import { SOL_MINT } from "../../../lib/config";

const fallbackRpcEndpoints = [
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  process.env.SOLANA_RPC_URL,
  clusterApiUrl("mainnet-beta"),
  "https://api.mainnet-beta.solana.com",
].filter(Boolean) as string[];

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim();

  if (!address) {
    return NextResponse.json({ error: "address is required." }, { status: 400 });
  }

  let owner: PublicKey;

  try {
    owner = new PublicKey(address);
  } catch {
    return NextResponse.json({ error: "Invalid Solana wallet address." }, { status: 400 });
  }

  const errors: string[] = [];

  for (const endpoint of dedupe(fallbackRpcEndpoints)) {
    try {
      const connection = new Connection(endpoint, "confirmed");
      const [lamports, tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getBalance(owner, "confirmed"),
        connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }, "confirmed"),
        connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }, "confirmed"),
      ]);

      const tokenHoldings = [...tokenAccounts.value, ...token2022Accounts.value]
        .reduce<Record<string, { mint: string; amount: number; decimals: number }>>((holdings, account) => {
          const parsed = account.account.data as ParsedAccountData;
          const info = parsed.parsed.info;
          const tokenAmount = info.tokenAmount;
          const amount = Number(tokenAmount.uiAmountString || tokenAmount.uiAmount || 0);

          if (!Number.isFinite(amount) || amount <= 0) return holdings;

          const mint = String(info.mint);
          const existing = holdings[mint];
          holdings[mint] = {
            mint,
            amount: (existing?.amount || 0) + amount,
            decimals: Number(tokenAmount.decimals || existing?.decimals || 0),
          };

          return holdings;
        }, {});

      const solBalance = lamports / 1_000_000_000;
      const holdings = [
        ...(solBalance > 0 ? [{ mint: SOL_MINT, amount: solBalance, decimals: 9 }] : []),
        ...Object.values(tokenHoldings),
      ];

      return NextResponse.json({
        solBalance,
        holdings,
      });
    } catch (error) {
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return NextResponse.json(
    {
      error: "Could not load public Solana balances right now.",
      details: errors.at(-1) || "All RPC endpoints failed.",
    },
    { status: 502 }
  );
}

function dedupe(values: string[]) {
  return Array.from(new Set(values));
}
