import Link from "next/link";
import { SiteShell } from "../components/SiteShell";

const stats = [
  ["VERIFIED SWAPS", "4", "Recent on-chain sample"],
  ["UNIQUE WALLETS", "2", "Distinct active traders"],
  ["REPEAT WALLETS", "0", "0.0% active on 2+ days"],
  ["FARMING FLAGS", "0", "Rapid or high-frequency activity"]
];

export default function LeaderboardPage() {
  return (
    <SiteShell>
      <main className="dashboard-page">
        <section className="page-hero">
          <div>
            <p className="eyebrow">LIVE ON-CHAIN ACTIVITY</p>
            <h1>Season Zero</h1>
            <p>Verified Ember swaps, wallet retention, and XP rankings.</p>
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
              <span>Wallets are shortened for privacy.</span>
            </div>
            <div className="table-row table-head">
              <span>RANK</span><span>WALLET</span><span>SWAPS</span><span>XP</span>
            </div>
            <div className="table-row">
              <span>#1</span><span>8wTB...BYNA</span><span>3</span><b>30</b>
            </div>
            <div className="table-row">
              <span>#2</span><span>B59j...KaTg</span><span>1</span><b>10</b>
            </div>
          </article>

          <article className="panel activity-panel">
            <p className="eyebrow">DAILY ACTIVITY</p>
            <h2>Swap volume</h2>
            <div className="bar-row"><span>07-25</span><i style={{ "--w": "100%" } as React.CSSProperties} /><b>3</b></div>
            <div className="bar-row"><span>07-24</span><i style={{ "--w": "33%" } as React.CSSProperties} /><b>1</b></div>
            <p className="small-copy">Analytics cover the latest 100 fee-wallet transactions. Counts represent verified swaps, not USD notional volume.</p>
          </article>
        </section>

        <aside className="warning-strip">The first five confirmed fee-paying swaps each UTC day earn 10 XP. Additional genuine swaps earn 1 XP. Rapid or unusually repetitive activity is marked for review.</aside>
      </main>
    </SiteShell>
  );
}
