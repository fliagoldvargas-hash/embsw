import { Connection, PublicKey, clusterApiUrl, type ParsedAccountData } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";
import { EMBER_MINT } from "../../../lib/config";
import { calculateSwapXp, getEarnedSwapsToday, getEmberHolderSnapshot, recordXpSwap } from "../../../lib/xp";

export const dynamic = "force-dynamic";

type XpSwapRequest = {
  signature?: string;
  wallet?: string;
  inputMint?: string;
  outputMint?: string;
  inAmount?: string;
  outAmount?: string;
};

const rpcEndpoints = [
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  process.env.SOLANA_RPC_URL,
  clusterApiUrl("mainnet-beta"),
  "https://api.mainnet-beta.solana.com",
].filter(Boolean) as string[];

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as XpSwapRequest | null;
  const signature = body?.signature?.trim();
  const wallet = body?.wallet?.trim();

  if (!signature || !wallet) {
    return NextResponse.json({ error: "signature and wallet are required." }, { status: 400 });
  }

  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: "Invalid Solana wallet address." }, { status: 400 });
  }

  const verified = await verifyConfirmedWalletSignature(signature, wallet);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  try {
    const holder = await getWalletEmberHolderSnapshot(wallet);
    const earnedSwapsToday = await getEarnedSwapsToday(wallet).catch(() => 0);
    const xpAwarded = calculateSwapXp(holder, earnedSwapsToday);
    const result = await recordXpSwap({
      signature,
      wallet,
      xpAwarded,
      inputMint: body?.inputMint,
      outputMint: body?.outputMint,
      inAmount: body?.inAmount,
      outAmount: body?.outAmount,
    });

    return NextResponse.json({
      ...result,
      holder,
      xpAwarded,
    });
  } catch {
    return NextResponse.json({ error: "Could not save XP right now." }, { status: 502 });
  }
}

async function getWalletEmberHolderSnapshot(wallet: string) {
  if (!EMBER_MINT) {
    return getEmberHolderSnapshot(0);
  }

  const owner = new PublicKey(wallet);
  const mint = new PublicKey(EMBER_MINT);

  for (const endpoint of Array.from(new Set(rpcEndpoints))) {
    try {
      const connection = new Connection(endpoint, "confirmed");
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint }, "confirmed");
      const balance = tokenAccounts.value.reduce((sum, account) => {
        const parsed = account.account.data as ParsedAccountData;
        const amount = Number(parsed.parsed.info.tokenAmount.uiAmount || 0);
        return sum + amount;
      }, 0);

      return getEmberHolderSnapshot(balance);
    } catch {
      continue;
    }
  }

  return getEmberHolderSnapshot(0);
}

async function verifyConfirmedWalletSignature(signature: string, wallet: string) {
  const errors: string[] = [];

  for (const endpoint of Array.from(new Set(rpcEndpoints))) {
    try {
      const connection = new Connection(endpoint, "confirmed");
      const transaction = await connection.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (!transaction) {
        errors.push(`${endpoint}: transaction not found`);
        continue;
      }

      if (transaction.meta?.err) {
        return { ok: false, error: "Transaction failed on-chain, so XP was not awarded." };
      }

      const walletSigned = transaction.transaction.message.accountKeys.some((account) => (
        account.signer && account.pubkey.toBase58() === wallet
      ));

      if (!walletSigned) {
        return { ok: false, error: "Wallet did not sign this transaction." };
      }

      return { ok: true };
    } catch (error) {
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return {
    ok: false,
    error: errors.length > 0 ? "Could not verify this transaction on Solana yet." : "No Solana RPC endpoint configured.",
  };
}
