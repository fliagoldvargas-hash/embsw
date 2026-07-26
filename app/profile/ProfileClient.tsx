"use client";

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EMBER_MINT } from "../lib/config";
import { EMBER_TOKEN } from "../lib/token";
import { SiteShell } from "../components/SiteShell";
import { useEmberWallet } from "../providers";

type Holding = {
  mint: string;
  symbol: string;
  name: string;
  amount: number;
  decimals: number;
  image: string | undefined;
};

type StoredSwap = {
  signature: string;
  wallet: string;
  timestamp: number;
};

type KnownToken = {
  symbol: string;
  name: string;
  image?: string;
};

const SWAP_HISTORY_KEY = "ember.swap.history";

export function ProfileClient() {
  const wallet = useEmberWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [swaps, setSwaps] = useState<StoredSwap[]>([]);

  const walletAddress = wallet.publicKey?.toBase58() || "";
  const walletSwaps = useMemo(() => swaps.filter((swap) => swap.wallet === walletAddress), [swaps, walletAddress]);
  const todaySwaps = useMemo(() => walletSwaps.filter((swap) => isToday(swap.timestamp)).length, [walletSwaps]);
  const activeDays = useMemo(() => new Set(walletSwaps.map((swap) => new Date(swap.timestamp).toISOString().slice(0, 10))).size, [walletSwaps]);
  const xp = calculateXp(walletSwaps);

  const loadProfile = useCallback(async () => {
    if (!wallet.publicKey) {
      setSolBalance(null);
      setHoldings([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [lamports, tokenAccounts] = await Promise.all([
        wallet.connection.getBalance(wallet.publicKey, "confirmed"),
        wallet.connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID }, "confirmed"),
      ]);

      const nextHoldings = tokenAccounts.value
        .map((account) => {
          const parsed = account.account.data.parsed.info;
          const tokenAmount = parsed.tokenAmount;
          const amount = Number(tokenAmount.uiAmount || 0);
          const mint = String(parsed.mint);

          if (!amount) return null;

          const known = getKnownToken(mint);
          return {
            mint,
            symbol: known.symbol,
            name: known.name,
            amount,
            decimals: Number(tokenAmount.decimals || 0),
            image: known.image,
          };
        })
        .filter((holding): holding is Holding => Boolean(holding))
        .sort((a, b) => {
          if (a.mint === EMBER_MINT) return -1;
          if (b.mint === EMBER_MINT) return 1;
          return b.amount - a.amount;
        });

      setSolBalance(lamports / 1_000_000_000);
      setHoldings(nextHoldings);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Could not load holdings from the Solana network.");
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  }, [wallet.connection, wallet.publicKey]);

  useEffect(() => {
    setSwaps(readStoredSwaps());
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <SiteShell>
      <main className="dashboard-page profile-page">
        <section className="page-hero">
          <div>
            <p className="eyebrow">YOUR WALLET</p>
            <h1>Profile & holdings</h1>
            <p>Your assets stay in your wallet. Ember Swap only reads public on-chain balances.</p>
          </div>
          <Link className="ghost-link" href="/">Back to swap</Link>
        </section>

        {!wallet.connected ? (
          <section className="empty-wallet panel">
            <div className="wallet-orb"><span /></div>
            <h2>Connect your wallet</h2>
            <p>Select a Solana wallet to see its holdings here.</p>
            <button className="white-button" onClick={wallet.connect} disabled={wallet.connecting}>
              {wallet.connecting ? "Connecting" : "Select Wallet"}
            </button>
          </section>
        ) : (
          <>
            <section className="connected-wallet panel">
              <div>
                <p className="mono-label">CONNECTED WALLET</p>
                <strong>{walletAddress}</strong>
              </div>
              <button onClick={loadProfile} disabled={loading}>{loading ? "Refreshing" : "Refresh balances"}</button>
            </section>

            <section className="profile-stats">
              <article className="stat-card highlight">
                <p>SEASON ZERO POINTS</p>
                <strong>{xp}</strong>
                <span>EMBER XP</span>
              </article>
              <article className="stat-card">
                <p>VERIFIED SWAPS</p>
                <strong>{walletSwaps.length}</strong>
                <span>{todaySwaps} today - {activeDays} active days</span>
              </article>
              <article className="stat-card">
                <p>SOL BALANCE</p>
                <strong>{solBalance === null ? "..." : formatTokenAmount(solBalance)}</strong>
                <span>Available for swaps and fees</span>
              </article>
            </section>

            <aside className="xp-strip">
              <span><b>+10 XP</b> for each of your first five verified daily swaps, then <b>+1 XP</b> per swap.</span>
              <Link href="/leaderboard">View leaderboard -&gt;</Link>
            </aside>

            <section className="holdings-head">
              <div>
                <p className="eyebrow">YOUR ASSETS</p>
                <h2>Holdings</h2>
              </div>
              <span>Public balances from Solana</span>
            </section>

            <section className="holdings-panel panel">
              {loading && <p className="muted-center">Loading public balances...</p>}
              {!loading && holdings.length === 0 && <p className="muted-center">No SPL token balances found in this wallet.</p>}
              {!loading && holdings.map((holding) => (
                <article className="holding-row" key={holding.mint}>
                  <div className="token-mark">
                    {holding.image ? <Image src={holding.image} alt={`${holding.symbol} logo`} width={34} height={34} /> : <span>{holding.symbol.slice(0, 2)}</span>}
                  </div>
                  <div>
                    <strong>{holding.symbol}</strong>
                    <span>{holding.name}</span>
                  </div>
                  <code>{shortAddress(holding.mint)}</code>
                  <b>{formatTokenAmount(holding.amount)}</b>
                </article>
              ))}
            </section>

            {error && <p className="profile-error">{error}</p>}

            <aside className="warning-strip">
              Profile data is calculated from public Solana activity. Ember Swap does not store wallet secrets or personal information. XP has no cash value or guaranteed token conversion.
            </aside>
          </>
        )}
      </main>
    </SiteShell>
  );
}

function readStoredSwaps() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SWAP_HISTORY_KEY) || "[]") as StoredSwap[];
    return Array.isArray(parsed) ? parsed.filter((swap) => swap.signature && swap.wallet && swap.timestamp) : [];
  } catch {
    return [];
  }
}

function getKnownToken(mint: string): KnownToken {
  if (mint === EMBER_MINT) {
    return {
      symbol: EMBER_TOKEN.symbol,
      name: EMBER_TOKEN.name,
      image: EMBER_TOKEN.image,
    };
  }

  return {
    symbol: shortAddress(mint),
    name: "SPL Token",
  };
}

function calculateXp(swaps: StoredSwap[]) {
  const byDay = new Map<string, number>();
  for (const swap of swaps) {
    const day = new Date(swap.timestamp).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }

  let xp = 0;
  byDay.forEach((count) => {
    xp += Math.min(count, 5) * 10;
    xp += Math.max(count - 5, 0);
  });
  return xp;
}

function isToday(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function shortAddress(value: string) {
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function formatTokenAmount(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1000) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  }
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
