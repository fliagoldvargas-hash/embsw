"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

type XpSummary = {
  totalXp: number;
  totalSwaps: number;
  todaySwaps: number;
  activeDays: number;
};

type KnownToken = {
  symbol: string;
  name: string;
  image?: string;
};

type ProfileHoldingResponse = {
  mint: string;
  amount: number;
  decimals: number;
};

export function ProfileClient() {
  const wallet = useEmberWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [xpSummary, setXpSummary] = useState<XpSummary>({
    totalXp: 0,
    totalSwaps: 0,
    todaySwaps: 0,
    activeDays: 0,
  });

  const walletAddress = wallet.publicKey?.toBase58() || "";

  const loadProfile = useCallback(async () => {
    if (!wallet.publicKey) {
      setSolBalance(null);
      setHoldings([]);
      setXpSummary({ totalXp: 0, totalSwaps: 0, todaySwaps: 0, activeDays: 0 });
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/solana/profile?address=${wallet.publicKey.toBase58()}`);
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Could not load public Solana balances right now."));
      }

      const rawHoldings = Array.isArray(data.holdings) ? data.holdings as ProfileHoldingResponse[] : [];
      const emberHoldings = EMBER_MINT
        ? rawHoldings.filter((holding) => holding.mint === EMBER_MINT)
        : [];
      const nextHoldings = await Promise.all(
        emberHoldings.map(async (holding) => {
          const metadata = await loadTokenMetadata(holding.mint).catch(() => getKnownToken(holding.mint));
          return {
            mint: holding.mint,
            symbol: metadata.symbol,
            name: metadata.name,
            amount: holding.amount,
            decimals: holding.decimals,
            image: metadata.image,
          };
        })
      );

      const sortedHoldings = nextHoldings
        .sort((a, b) => {
          if (a.mint === EMBER_MINT) return -1;
          if (b.mint === EMBER_MINT) return 1;
          return b.amount - a.amount;
        });

      setSolBalance(Number(data.solBalance ?? 0));
      setHoldings(sortedHoldings);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Could not load public balances right now. Try refreshing.");
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  }, [wallet.publicKey]);

  const emberHolding = holdings.find((holding) => holding.mint === EMBER_MINT);

  const loadXp = useCallback(async () => {
    if (!wallet.publicKey) return;

    try {
      const response = await fetch(`/api/xp/profile?wallet=${wallet.publicKey.toBase58()}`);
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Could not load XP right now."));
      }

      setXpSummary({
        totalXp: Number(data.totalXp || 0),
        totalSwaps: Number(data.totalSwaps || 0),
        todaySwaps: Number(data.todaySwaps || 0),
        activeDays: Number(data.activeDays || 0),
      });
    } catch {
      setXpSummary({ totalXp: 0, totalSwaps: 0, todaySwaps: 0, activeDays: 0 });
    }
  }, [wallet.publicKey]);

  const refreshProfile = useCallback(() => {
    loadProfile();
    loadXp();
  }, [loadProfile, loadXp]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <SiteShell>
      <main className="dashboard-page profile-page">
        <section className="page-hero">
          <div>
            <p className="eyebrow">YOUR WALLET</p>
            <h1>Profile & holdings</h1>
            <p>Your assets stay in your wallet. GM SWAP only reads public on-chain balances.</p>
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
              <button className="refresh-balances-button" onClick={refreshProfile} disabled={loading}>
                <span className="refresh-glyph" aria-hidden="true" />
                <span>{loading ? "Refreshing" : "Refresh balances"}</span>
              </button>
            </section>

            <section className="profile-stats">
              <article className="stat-card highlight">
                <p>SEASON ZERO POINTS</p>
                <strong>{xpSummary.totalXp}</strong>
                <span>$GM XP</span>
              </article>
              <article className="stat-card">
                <p>VERIFIED SWAPS</p>
                <strong>{xpSummary.totalSwaps}</strong>
                <span>{xpSummary.todaySwaps} today - {xpSummary.activeDays} active days</span>
              </article>
              <article className="stat-card">
                <p>SOL BALANCE</p>
                <strong>{solBalance === null ? "..." : formatTokenAmount(solBalance)}</strong>
                <span>Available for swaps and fees</span>
              </article>
            </section>

            <aside className="xp-strip">
              <span>Hold <b>$GM</b> to earn XP. Bronze earns x1, Silver earns x1.5, and Gold earns x3.</span>
              <Link href="/leaderboard">View leaderboard -&gt;</Link>
            </aside>

            <section className="holdings-head">
              <div>
                <p className="eyebrow">YOUR ASSETS</p>
                <h2>$GM holdings</h2>
              </div>
              <span>Public $GM balance from Solana</span>
            </section>

            <section className="holdings-panel panel">
              {loading && <p className="muted-center">Loading public balances...</p>}
              {!loading && !EMBER_MINT && <p className="muted-center">$GM holdings will appear after launch.</p>}
              {!loading && EMBER_MINT && !emberHolding && <p className="muted-center">No $GM balance found in this wallet.</p>}
              {!loading && emberHolding && (
                <article className="holding-row">
                  <div className="token-mark">
                    {emberHolding.image ? <img src={emberHolding.image} alt="$GM logo" width={34} height={34} /> : <span>OR</span>}
                  </div>
                  <div>
                    <strong>$GM</strong>
                    <span>{emberHolding.name}</span>
                  </div>
                  <code>{shortAddress(emberHolding.mint)}</code>
                  <b>{formatTokenAmount(emberHolding.amount)}</b>
                </article>
              )}
            </section>

            {error && <p className="profile-error">{error}</p>}

            <aside className="warning-strip">
              Profile data is calculated from public Solana activity. GM SWAP does not store wallet secrets or personal information. XP has no cash value or guaranteed token conversion.
            </aside>
          </>
        )}
      </main>
    </SiteShell>
  );
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

async function loadTokenMetadata(mint: string): Promise<KnownToken> {
  const response = await fetch(`/api/jupiter/token?query=${encodeURIComponent(mint)}`);
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Token metadata unavailable."));
  }

  return {
    symbol: String(data.symbol || shortAddress(mint)),
    name: String(data.name || "SPL Token"),
    image: typeof data.image === "string" ? data.image : undefined,
  };
}

async function readJsonResponse(response: Response) {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function getApiErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (typeof data.details === "string" && !/jsonrpc|access forbidden|403/i.test(data.details)) return data.details;
  return fallback;
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
