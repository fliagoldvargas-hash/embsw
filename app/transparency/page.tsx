import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl, type ParsedTransactionWithMeta } from "@solana/web3.js";
import Link from "next/link";
import { SeasonCountdown } from "../components/SeasonCountdown";
import { SiteShell } from "../components/SiteShell";
import { formatSeasonDate, getCurrentSeason, TREASURY_WALLET } from "../lib/season";

export const dynamic = "force-dynamic";

const rpcEndpoints = [
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  process.env.SOLANA_RPC_URL,
  clusterApiUrl("mainnet-beta"),
  "https://api.mainnet-beta.solana.com",
].filter(Boolean) as string[];

export default async function TransparencyPage() {
  const season = getCurrentSeason();
  const treasury = await loadTreasuryData(season.start, season.end).catch((error) => ({
    balanceSol: 0,
    seasonInflowSol: 0,
    transactionCount: 0,
    warning: error instanceof Error ? error.message : "Treasury data is temporarily unavailable.",
  }));

  const goldPool = treasury.seasonInflowSol * 0.4;
  const projectGrowth = treasury.seasonInflowSol * 0.6;

  return (
    <SiteShell>
      <main className="transparency-page">
        <section className="transparency-hero">
          <div>
            <p className="eyebrow">TREASURY TRANSPARENCY</p>
            <h1>Every SOL is visible.</h1>
            <p>
              GM's public treasury is designed for transparent season tracking. Reward seasons begin
              automatically after the $GM mint and pump.fun link are live.
            </p>
            <div className="transparency-wallet-row">
              <span>Treasury wallet</span>
              <code>{TREASURY_WALLET}</code>
              <a href={`https://solscan.io/account/${TREASURY_WALLET}`} target="_blank">Solscan -&gt;</a>
            </div>
          </div>
        </section>

        <section className="transparency-grid">
          <article className="transparency-stat">
            <span>Treasury balance</span>
            <strong>{formatSol(treasury.balanceSol)}</strong>
            <p>Total SOL currently held by the public treasury wallet.</p>
          </article>
          <article className="transparency-stat">
            <span>{season.isLive ? "Current season rewards" : "Season rewards"}</span>
            <strong>{formatSol(treasury.seasonInflowSol)}</strong>
            <p>
              {season.isLive
                ? `Estimated incoming SOL since ${formatSeasonDate(season.start)} UTC.`
                : "Season accounting starts after the public $GM launch."}
            </p>
          </article>
          <article className="transparency-stat">
            <span>Gold pool</span>
            <strong>{formatSol(goldPool)}</strong>
            <p>{season.isLive ? "40% of this season's estimated creator rewards." : "40% of live season creator rewards."}</p>
          </article>
          <article className="transparency-stat">
            <span>Project growth</span>
            <strong>{formatSol(projectGrowth)}</strong>
            <p>{season.isLive ? "60% funds operations, product, infrastructure, and growth." : "60% supports operations, product, infrastructure, and growth."}</p>
          </article>
        </section>

        <section className="transparency-season panel">
          <div>
            <p className="eyebrow">{season.label.toUpperCase()}</p>
            <h2>{season.isLive && season.end ? `Season closes ${formatSeasonDate(season.end)} UTC` : "Season Zero starts at launch"}</h2>
            <p>
              {season.isLive
                ? "Seasons close every 15 days after the $GM CA and pump.fun link go live. Gold holders share the finalized Gold pool by their seasonal XP share after anti-spam review."
                : "The transparency engine is ready. Once the $GM CA and pump.fun link are added, countdowns, season accounting, and reward estimates switch on automatically."}
            </p>
          </div>
          {season.isLive && season.end ? (
            <SeasonCountdown endsAt={season.end.toISOString()} />
          ) : (
            <div className="season-countdown" aria-label="Season status">
              <span>Season status</span>
              <strong>Pending launch</strong>
            </div>
          )}
        </section>

        <section className="transparency-split">
          <article>
            <span>40%</span>
            <h3>Gold holders</h3>
            <p>Shared by eligible Gold wallets according to their seasonal Gold XP share.</p>
          </article>
          <article>
            <span>60%</span>
            <h3>Project growth</h3>
            <p>Reserved for operations, infrastructure, product development, and growth campaigns.</p>
          </article>
        </section>

        <section className="transparency-token-plan panel">
          <div className="transparency-section-head">
            <p className="eyebrow">PROJECT TOKEN POSITION</p>
            <h2>3% of $GM is reserved for long-term alignment.</h2>
            <p>
              The project plans to buy and hold 3% of the token supply, split into clear buckets so the
              community can understand how those tokens support GM SWAP over time.
            </p>
          </div>
          <div className="transparency-token-grid">
            <article><span>1%</span><strong>Treasury</strong><p>Held as a strategic reserve for long-term project stability.</p></article>
            <article><span>1%</span><strong>Marketing</strong><p>Used for launch campaigns, creators, partnerships, and growth pushes.</p></article>
            <article><span>1%</span><strong>Community</strong><p>Reserved for community initiatives, events, quests, and contributor rewards.</p></article>
          </div>
        </section>

        <section className="transparency-notes panel">
          <p className="eyebrow">HOW IT IS CALCULATED</p>
          <div className="transparency-note-grid">
            <article><strong>Public treasury</strong><span>The wallet address is public and can be checked on Solscan at any time.</span></article>
            <article><strong>Season income</strong><span>Incoming SOL transfers during each live season are summed as estimated creator rewards.</span></article>
            <article><strong>Estimated live</strong><span>Numbers update during live seasons and finalize at close after anti-spam review.</span></article>
            <article><strong>Gold rewards</strong><span>Estimated reward share is based on Gold pool and seasonal Gold XP.</span></article>
          </div>
        </section>

        {treasury.warning && <aside className="warning-strip">{treasury.warning}</aside>}

        <aside className="docs-final-note">
          Rewards shown during the season are estimates. Final rewards are confirmed from treasury transactions and seasonal XP after review.
        </aside>
      </main>
    </SiteShell>
  );
}

async function loadTreasuryData(seasonStart: Date, seasonEnd: Date | null) {
  const treasury = new PublicKey(TREASURY_WALLET);
  const startSeconds = Math.floor(seasonStart.getTime() / 1000);
  const endSeconds = seasonEnd ? Math.floor(seasonEnd.getTime() / 1000) : 0;
  const errors: string[] = [];

  for (const endpoint of Array.from(new Set(rpcEndpoints))) {
    try {
      const connection = new Connection(endpoint, "confirmed");
      const balanceLamports = await connection.getBalance(treasury, "confirmed");
      const signatures = await connection.getSignaturesForAddress(treasury, { limit: 100 });
      const seasonSignatures = seasonEnd ? signatures
        .filter((signature) => {
          const blockTime = signature.blockTime || 0;
          return blockTime >= startSeconds && blockTime < endSeconds;
        })
        .map((signature) => signature.signature) : [];

      const transactions = seasonSignatures.length > 0
        ? await connection.getParsedTransactions(seasonSignatures, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        })
        : [];

      const seasonInflowLamports = transactions.reduce((sum, transaction) => (
        sum + getTreasuryPositiveLamportDelta(transaction, TREASURY_WALLET)
      ), 0);

      return {
        balanceSol: balanceLamports / LAMPORTS_PER_SOL,
        seasonInflowSol: seasonInflowLamports / LAMPORTS_PER_SOL,
        transactionCount: seasonSignatures.length,
        warning: seasonSignatures.length === 100
          ? "Only the latest 100 treasury transactions are included in this estimate."
          : "",
      };
    } catch (error) {
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  throw new Error(errors.at(-1) || "Could not load treasury data right now.");
}

function getTreasuryPositiveLamportDelta(transaction: ParsedTransactionWithMeta | null, treasuryAddress: string) {
  if (!transaction?.meta) return 0;

  const accountIndex = transaction.transaction.message.accountKeys.findIndex((account) => (
    account.pubkey.toBase58() === treasuryAddress
  ));

  if (accountIndex < 0) return 0;

  const pre = transaction.meta.preBalances[accountIndex] || 0;
  const post = transaction.meta.postBalances[accountIndex] || 0;
  return Math.max(0, post - pre);
}

function formatSol(value: number) {
  if (!Number.isFinite(value)) return "0 SOL";
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1 ? 3 : 6,
  }).format(value)} SOL`;
}
