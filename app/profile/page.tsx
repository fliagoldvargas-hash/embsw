import Link from "next/link";
import { SiteShell } from "../components/SiteShell";

export default function ProfilePage() {
  return (
    <SiteShell>
      <main className="dashboard-page profile-page">
        <section className="page-hero">
          <div>
            <p className="eyebrow">YOUR WALLET</p>
            <h1>Profile & holdings</h1>
            <p>Your assets stay in your wallet. Ember Swap only reads public on-chain balances.</p>
          </div>
          <Link className="ghost-link" href="/">← Back to swap</Link>
        </section>

        <section className="empty-wallet panel">
          <div className="wallet-orb"><span /></div>
          <h2>Connect your wallet</h2>
          <p>Select a Solana wallet to see its holdings here.</p>
          <button className="white-button">Select Wallet</button>
        </section>
      </main>
    </SiteShell>
  );
}
