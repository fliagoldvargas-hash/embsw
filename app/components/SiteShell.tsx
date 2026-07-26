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
        <Link href="/" className="brand" aria-label="Ember Swap home">
          <Image src="/assets/ember-swap-logo.png" alt="Ember Swap logo" width={43} height={43} priority />
          <span>EMBER<span>SWAP</span></span>
        </Link>
        <div className="live-badge"><i /> MAINNET LIVE</div>
        <div className="nav-actions">
          <Link className={pathname === "/leaderboard" ? "nav-link active" : "nav-link"} href="/leaderboard">Leaderboard</Link>
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
