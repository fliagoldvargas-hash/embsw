"use client";

import { Connection, PublicKey, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type InjectedSolanaWallet = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: PublicKey;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction?: (transaction: VersionedTransaction) => Promise<VersionedTransaction>;
};

type EmberWalletContextValue = {
  connection: Connection;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  walletName: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: ((transaction: VersionedTransaction) => Promise<VersionedTransaction>) | null;
};

const EmberWalletContext = createContext<EmberWalletContextValue | null>(null);

const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta");

declare global {
  interface Window {
    solana?: InjectedSolanaWallet;
    solflare?: InjectedSolanaWallet;
  }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const connection = useMemo(() => new Connection(endpoint, "confirmed"), []);
  const [provider, setProvider] = useState<InjectedSolanaWallet | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connecting, setConnecting] = useState(false);

  const detectProvider = useCallback(() => {
    if (typeof window === "undefined") return null;
    return window.solana || window.solflare || null;
  }, []);

  const connect = useCallback(async () => {
    const detected = detectProvider();
    if (!detected) {
      window.open("https://phantom.app/", "_blank", "noopener,noreferrer");
      return;
    }

    setConnecting(true);
    try {
      const result = await detected.connect();
      setProvider(detected);
      setPublicKey(result.publicKey);
    } finally {
      setConnecting(false);
    }
  }, [detectProvider]);

  const disconnect = useCallback(async () => {
    if (provider) {
      await provider.disconnect();
    }
    setProvider(null);
    setPublicKey(null);
  }, [provider]);

  const value = useMemo<EmberWalletContextValue>(
    () => ({
      connection,
      publicKey,
      connected: Boolean(publicKey),
      connecting,
      walletName: provider?.isSolflare ? "Solflare" : provider?.isPhantom ? "Phantom" : "Wallet",
      connect,
      disconnect,
      signTransaction: provider?.signTransaction ? provider.signTransaction.bind(provider) : null,
    }),
    [connect, connection, connecting, disconnect, provider, publicKey]
  );

  return (
    <EmberWalletContext.Provider value={value}>
      {children}
    </EmberWalletContext.Provider>
  );
}

export function useEmberWallet() {
  const context = useContext(EmberWalletContext);
  if (!context) {
    throw new Error("useEmberWallet must be used inside AppProviders.");
  }
  return context;
}
