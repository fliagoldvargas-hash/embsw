import Link from "next/link";
import { SiteShell } from "../components/SiteShell";

const stats = [
  ["VERIFIED SWAPS", "0", "Starts after launch"],
  ["UNIQUE WALLETS", "0", "Connects after live swaps"],
  ["REPEAT WALLETS", "0", "Measured after trading starts"],
  ["FARMING FLAGS", "0", "Review system pending"]
];

export default function LeaderboardPage() {
  return (
    <SiteShell>
      <main className="dashboard-page">
        <section className="page-hero">
          <div>
            <p className="eyebrow">LIVE ON-CHAIN ACTIVITY</p>
            <h1>Season Zero</h1>
            <p>Season Zero begins when EMBER launches and swaps go live.</p>
          </div>
          <Link className="ghost-link" href="/">← Back to swap</Link>
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
              <span>No wallets ranked before launch.</span>
            </div>
            <div className="table-row table-head">
              <span>RANK</span><span>WALLET</span><span>SWAPS</span><span>XP</span>
            </div>
            <div className="table-row">
              <span>-</span><span>Waiting for launch</span><span>0</span><b>0</b>
            </div>
          </article>

          <article className="panel activity-panel">
            <p className="eyebrow">DAILY ACTIVITY</p>
            <h2>Swap volume</h2>
            <div className="bar-row"><span>LIVE</span><i style={{ "--w": "0%" } as React.CSSProperties} /><b>0</b></div>
            <div className="bar-row"><span>TODAY</span><i style={{ "--w": "0%" } as React.CSSProperties} /><b>0</b></div>
            <p className="small-copy">Live activity will populate from confirmed Ember Swap transactions after token launch.</p>
          </article>
        </section>

        <aside className="warning-strip">Season Zero XP starts after launch. The first five confirmed swaps each UTC day earn 10 XP. Additional genuine swaps earn 1 XP.</aside>
      </main>
    </SiteShell>
  );
}
