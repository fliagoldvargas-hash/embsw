"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEmberWallet } from "../providers";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wallet = useEmberWallet();

  return (
    <div className="site-shell">
      <nav className="top-nav">
        <Link href="/" className="brand" aria-label="Orbit Swap home">
          <Image src="/assets/orbit-swap-logo.png" alt="Orbit Swap logo" width={43} height={43} priority />
          <span>ORBIT<span>SWAP</span></span>
        </Link>
        <div className="live-badge"><i /> MAINNET LIVE</div>
        <div className="nav-actions">
          <Link className={pathname === "/docs" ? "nav-link active" : "nav-link"} href="/docs">Docs</Link>
          <a className="nav-icon-link" href="https://x.com/Orbitswap_" target="_blank" rel="noreferrer" aria-label="Orbit Swap on X">
            <Image src="/assets/x-logo.png" alt="" width={15} height={15} />
          </a>
          <Link className={pathname === "/transparency" ? "nav-link active" : "nav-link"} href="/transparency">Transparency</Link>
          <Link className={pathname === "/leaderboard" ? "nav-link active" : "nav-link"} href="/leaderboard">Leaderboard</Link>
          <button className="nav-link nav-soon" type="button" disabled aria-disabled="true">
            XP Market <span>Soon</span>
          </button>
          <Link className={pathname === "/profile" ? "profile-button active" : "profile-button"} href="/profile">Profile</Link>
          <button className="wallet-button wallet-connect-button" onClick={wallet.connected ? wallet.disconnect : wallet.connect}>
            {wallet.connected && wallet.publicKey
              ? `${wallet.publicKey.toBase58().slice(0, 4)}...${wallet.publicKey.toBase58().slice(-4)}`
              : wallet.connecting
                ? "Connecting"
                : "Select Wallet"}
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
