import Link from "next/link";
import { SeasonCountdown } from "../components/SeasonCountdown";
import { SiteShell } from "../components/SiteShell";
import { formatSeasonDate, getCurrentSeason } from "../lib/season";
import { getXpLeaderboard } from "../lib/xp";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaders = await getXpLeaderboard(10).catch(() => []);
  const totalSwaps = leaders.reduce((sum, wallet) => sum + wallet.totalSwaps, 0);
  const repeatWallets = leaders.filter((wallet) => wallet.activeDays > 1).length;
  const maxSwaps = Math.max(...leaders.map((wallet) => wallet.totalSwaps), 1);
  const season = getCurrentSeason();

  const stats = [
    ["VERIFIED SWAPS", String(totalSwaps), leaders.length > 0 ? "Confirmed Ember Swap trades" : "No verified swaps yet"],
    ["UNIQUE WALLETS", String(leaders.length), leaders.length > 0 ? "Distinct active traders" : "No ranked wallets yet"],
    ["REPEAT WALLETS", String(repeatWallets), leaders.length > 0 ? "Active on 2+ days" : "No repeat activity yet"],
    ["FARMING FLAGS", "AUTO", "Spam activity is excluded"],
  ];

  return (
    <SiteShell>
      <main className="dashboard-page">
        <section className="page-hero">
          <div>
            <p className="eyebrow">LIVE ON-CHAIN ACTIVITY</p>
            <h1>Season Zero</h1>
            <p>Season Zero tracks confirmed Ember Swap transactions and wallet XP. Current season closes {formatSeasonDate(season.end)} UTC.</p>
          </div>
          <div className="page-hero-actions">
            <SeasonCountdown endsAt={season.end.toISOString()} />
            <Link className="ghost-link" href="/">Back to swap</Link>
          </div>
        </section>

        <section className="stats-grid">
          {stats.map(([label, value, note]) => (
            <article className="stat-card" key={label}>
              <p className="mono-label">{label}</p>
              <strong>{value}</strong>
              <span>{note}</span>
            </article>
          ))}
        </section>

        <section className="analytics-grid">
          <article className="panel leaderboard-panel">
            <p className="eyebrow">TOP TRADERS</p>
            <div className="panel-heading">
              <h2>XP leaderboard</h2>
              <span>{leaders.length > 0 ? "Wallets are shortened for privacy." : "No wallets ranked yet."}</span>
            </div>
            <div className="table-row table-head">
              <span>RANK</span><span>WALLET</span><span>SWAPS</span><span>XP</span>
            </div>
            {leaders.length === 0 ? (
              <div className="table-row">
                <span>-</span><span>No verified swaps yet</span><span>0</span><b>0</b>
              </div>
            ) : leaders.map((wallet, index) => (
              <div className="table-row" key={wallet.wallet}>
                <span>#{index + 1}</span><span>{shortAddress(wallet.wallet)}</span><span>{wallet.totalSwaps}</span><b>{wallet.totalXp}</b>
              </div>
            ))}
          </article>

          <article className="panel activity-panel">
            <p className="eyebrow">DAILY ACTIVITY</p>
            <h2>Top wallet volume</h2>
            {leaders.length === 0 ? (
              <>
                <div className="bar-row"><span>SEASON</span><i style={{ "--w": "0%" } as React.CSSProperties} /><b>0</b></div>
                <div className="bar-row"><span>TODAY</span><i style={{ "--w": "0%" } as React.CSSProperties} /><b>0</b></div>
              </>
            ) : leaders.slice(0, 5).map((wallet) => (
              <div className="bar-row" key={wallet.wallet}>
                <span>{shortAddress(wallet.wallet)}</span>
                <i style={{ "--w": `${Math.max((wallet.totalSwaps / maxSwaps) * 100, 8)}%` } as React.CSSProperties} />
                <b>{wallet.totalSwaps}</b>
              </div>
            ))}
            <p className="small-copy">Activity is built from verified swap signatures saved after wallet confirmation.</p>
          </article>
        </section>

        <aside className="warning-strip">Season Zero XP is holder-gated. Confirmed swaps are saved only after on-chain success, and suspicious activity is automatically detected and excluded from XP.</aside>
      </main>
    </SiteShell>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
