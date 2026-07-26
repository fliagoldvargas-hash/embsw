import Link from "next/link";
import { SiteShell } from "../components/SiteShell";
import { DAILY_BONUS_SWAP_LIMIT, DAILY_BONUS_XP, BASE_SWAP_XP } from "../lib/xp";
import { EMBER_TOKEN } from "../lib/token";
import { SWAP_FEE_BPS, DEFAULT_SLIPPAGE_BPS } from "../lib/config";

const sections = [
  ["Overview", "#overview"],
  ["Swap Engine", "#swap-engine"],
  ["XP", "#xp"],
  ["Rewards", "#rewards"],
  ["Token Launch", "#token-launch"],
  ["Security", "#security"],
  ["Setup", "#setup"],
];

const architecture = [
  ["Wallet", "Users connect with Privy wallet login or an injected Solana wallet. The wallet signs every transaction."],
  ["Routing", "Quotes and swap transactions are requested through Ember API routes, then routed by Jupiter on Solana mainnet."],
  ["Verification", "After a confirmed swap, Ember verifies the signature on-chain before XP can be written."],
  ["Profile", "Balances come from public Solana RPC reads. XP and leaderboard data come from Supabase once configured."],
];

const xpRules = [
  [`+${DAILY_BONUS_XP} XP`, `For each of the first ${DAILY_BONUS_SWAP_LIMIT} confirmed swaps per wallet per UTC day.`],
  [`+${BASE_SWAP_XP} XP`, "For additional confirmed swaps after the daily bonus window."],
  ["0 XP", "For duplicate signatures, failed on-chain transactions, or transactions not signed by the connected wallet."],
  ["Holder gated", "The economy model says only EMBER holders earn XP after launch; current code is ready for the holder check to be added when the mint is live."],
];

const tiers = [
  ["No Holder", "0 EMBER", "Can trade, but does not earn XP or rewards."],
  ["Tier 3", "1,000,000 to 9,999,999 EMBER", "Earn XP and unlock early feature access."],
  ["Tier 2", "10,000,000 to 19,999,999 EMBER", "Earn XP, gain voting power, and keep Tier 3 benefits."],
  ["Tier 1", "20,000,000+ EMBER", "Earn boosted XP and participate in seasonal reward distribution."],
];

const setupSteps = [
  ["Token", "When EMBER launches, paste the mint and pump.fun URL in app/lib/token.ts."],
  ["Supabase", "Run the SQL from SUPABASE_XP_SETUP.md, then add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel."],
  ["Privy", "Keep NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET configured for wallet login."],
  ["Deploy", "Commit to main. Vercel deploys automatically to emberswap.pro."],
];

export default function DocsPage() {
  return (
    <SiteShell>
      <main className="docs-page">
        <section className="docs-hero" id="overview">
          <div className="docs-hero-copy">
            <p className="eyebrow">EMBER SWAP DOCS</p>
            <h1>Swap fast. Earn XP. Stay in control.</h1>
            <p>
              Ember Swap is a Solana swap interface built around transparent routing,
              wallet-side approvals, public profile data, and a seasonal XP economy for EMBER holders.
            </p>
            <div className="docs-actions">
              <Link className="docs-primary" href="/">Open swap</Link>
              <Link className="docs-secondary" href="/leaderboard">View leaderboard</Link>
            </div>
          </div>
          <div className="docs-orbit-card" aria-label="Ember Swap system summary">
            <span className="orbit-ring" />
            <div className="orbit-core">
              <img src="/assets/ember-swap-logo.png" alt="Ember Swap logo" />
            </div>
            <div className="orbit-pill orbit-pill-a">Jupiter routing</div>
            <div className="orbit-pill orbit-pill-b">Supabase XP</div>
            <div className="orbit-pill orbit-pill-c">Solana verified</div>
          </div>
        </section>

        <nav className="docs-toc" aria-label="Docs sections">
          {sections.map(([label, href]) => (
            <a href={href} key={href}>{label}</a>
          ))}
        </nav>

        <section className="docs-metric-grid" aria-label="Project settings">
          <article>
            <span>Network</span>
            <strong>Mainnet</strong>
            <p>All real swaps and balance reads target Solana mainnet.</p>
          </article>
          <article>
            <span>Platform fee</span>
            <strong>{(SWAP_FEE_BPS / 100).toFixed(2)}%</strong>
            <p>Current project fee is disabled until intentionally changed.</p>
          </article>
          <article>
            <span>Slippage</span>
            <strong>{(DEFAULT_SLIPPAGE_BPS / 100).toFixed(2)}%</strong>
            <p>Default protection used when requesting Jupiter quotes.</p>
          </article>
          <article>
            <span>Token status</span>
            <strong>{EMBER_TOKEN.mint ? "Live" : "Pre-launch"}</strong>
            <p>EMBER details auto-fill after the mint is added.</p>
          </article>
        </section>

        <section className="docs-section" id="swap-engine">
          <div className="docs-section-head">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>Swap engine</h2>
            <p>Ember keeps user control at the center: the app builds routes, but wallets approve and sign every transaction.</p>
          </div>
          <div className="docs-flow">
            {architecture.map(([title, body], index) => (
              <article className="docs-flow-card" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="docs-split" id="xp">
          <article className="docs-panel docs-xp-panel">
            <p className="eyebrow">SEASON ZERO</p>
            <h2>XP system</h2>
            <p>
              XP is saved by wallet in Supabase after Ember verifies the transaction signature on Solana.
              This makes profile points portable across browsers and gives the leaderboard one shared source of truth.
            </p>
            <div className="docs-rule-list">
              {xpRules.map(([value, label]) => (
                <div key={value}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="docs-panel docs-code-card">
            <p className="eyebrow">DATA PIPELINE</p>
            <h3>Verified before write</h3>
            <pre>{`swap confirmed
  -> POST /api/xp/swaps
  -> verify signature on Solana
  -> insert xp_swaps
  -> trigger updates xp_wallets
  -> profile + leaderboard refresh`}</pre>
          </article>
        </section>

        <section className="docs-section" id="rewards">
          <div className="docs-section-head">
            <p className="eyebrow">REWARDS ECONOMY</p>
            <h2>Holder tiers</h2>
            <p>
              Seasons run for 15 days. Seasonal XP decides leaderboard position and eligibility,
              while historical XP can later support badges, reputation, or long-term recognition.
            </p>
          </div>
          <div className="docs-tier-grid">
            {tiers.map(([tier, requirement, benefit]) => (
              <article className="docs-tier" key={tier}>
                <span>{tier}</span>
                <strong>{requirement}</strong>
                <p>{benefit}</p>
              </article>
            ))}
          </div>
          <aside className="docs-reward-band">
            <div>
              <span>Tier 1 rewards pool</span>
              <strong>40%</strong>
              <p>Shared by eligible Tier 1 wallets based on their share of seasonal Tier 1 XP.</p>
            </div>
            <div>
              <span>Project growth</span>
              <strong>60%</strong>
              <p>Funds operations, product improvements, infrastructure, and growth campaigns.</p>
            </div>
          </aside>
        </section>

        <section className="docs-split" id="token-launch">
          <article className="docs-panel">
            <p className="eyebrow">TOKEN LAUNCH</p>
            <h2>EMBER mint setup</h2>
            <p>
              EMBER launches on pump.fun. Once the token is live, update one config file and
              the app will automatically unlock token-specific routes, links, contract display,
              DexScreener metrics, and EMBER swap pairs.
            </p>
            <div className="docs-file-path">app/lib/token.ts</div>
          </article>
          <article className="docs-panel">
            <p className="eyebrow">LIVE DATA</p>
            <h2>What updates automatically</h2>
            <ul className="docs-check-list">
              <li>Contract address copy state</li>
              <li>pump.fun and Dex links</li>
              <li>Price, market cap, volume, and liquidity</li>
              <li>EMBER availability inside the token selector</li>
            </ul>
          </article>
        </section>

        <section className="docs-section" id="security">
          <div className="docs-section-head">
            <p className="eyebrow">SECURITY MODEL</p>
            <h2>What Ember does not touch</h2>
            <p>
              Ember never asks for recovery phrases, never stores wallet secrets, and never executes
              a swap without wallet approval. Backend keys stay server-side.
            </p>
          </div>
          <div className="docs-security-grid">
            <article><strong>Wallet controlled</strong><span>Phantom or Privy-compatible wallet approval remains mandatory.</span></article>
            <article><strong>Server-side secrets</strong><span>Supabase service role and Privy secret are never exposed to browser code.</span></article>
            <article><strong>Duplicate protection</strong><span>Each swap signature is unique in the XP database.</span></article>
            <article><strong>Anti-farming ready</strong><span>Suspicious patterns can be excluded from XP as the season rules mature.</span></article>
          </div>
        </section>

        <section className="docs-section" id="setup">
          <div className="docs-section-head">
            <p className="eyebrow">OPERATIONS</p>
            <h2>Setup checklist</h2>
            <p>These are the project switches that keep Ember Swap functional in production.</p>
          </div>
          <div className="docs-setup-list">
            {setupSteps.map(([title, body], index) => (
              <article key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="docs-final-note">
          XP and rewards are product mechanics, not a guaranteed cash value or guaranteed token conversion.
          Final reward details should remain adjustable until the public tokenomics are locked.
        </aside>
      </main>
    </SiteShell>
  );
}
