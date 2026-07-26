import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";
import { recordXpSwap } from "../../../lib/xp";

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
    const result = await recordXpSwap({
      signature,
      wallet,
      inputMint: body?.inputMint,
      outputMint: body?.outputMint,
      inAmount: body?.inAmount,
      outAmount: body?.outAmount,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not save XP right now." }, { status: 502 });
  }
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
