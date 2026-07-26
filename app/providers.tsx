"use client";

import { PrivyProvider, useLogin, usePrivy } from "@privy-io/react-auth";
import {
  type ConnectedStandardSolanaWallet,
  toSolanaWalletConnectors,
  useCreateWallet,
  useSignTransaction,
  useWallets,
} from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
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
const websocketEndpoint = endpoint.startsWith("https://") ? endpoint.replace("https://", "wss://") : undefined;
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

declare global {
  interface Window {
    solana?: InjectedSolanaWallet;
    solflare?: InjectedSolanaWallet;
  }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  if (!privyAppId) {
    return <LegacyInjectedWalletProvider>{children}</LegacyInjectedWalletProvider>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        solana: {
          rpcs: {
            "solana:mainnet": {
              rpc: createSolanaRpc(endpoint),
              rpcSubscriptions: createSolanaRpcSubscriptions(websocketEndpoint || "wss://api.mainnet-beta.solana.com"),
            },
          },
        },
        appearance: {
          accentColor: "#a6ff1a",
          logo: "/assets/ember-swap-logo.png",
          showWalletLoginFirst: true,
          walletChainType: "solana-only",
        },
        loginMethods: ["wallet"],
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors({ shouldAutoConnect: true }),
          },
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "all-users",
          },
        },
      }}
    >
      <PrivyWalletProvider>{children}</PrivyWalletProvider>
    </PrivyProvider>
  );
}

function PrivyWalletProvider({ children }: { children: React.ReactNode }) {
  const connection = useMemo(() => new Connection(endpoint, "confirmed"), []);
  const { ready, authenticated, logout } = usePrivy();
  const { login } = useLogin();
  const { ready: walletsReady, wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { signTransaction: privySignTransaction } = useSignTransaction();
  const [connecting, setConnecting] = useState(false);

  const selectedWallet = useMemo(() => {
    const solanaWallets = wallets as ConnectedStandardSolanaWallet[];
    return (
      solanaWallets.find((wallet) => wallet.standardWallet?.name === "Privy") ||
      solanaWallets.find((wallet) => Boolean(wallet.address)) ||
      null
    );
  }, [wallets]);

  const publicKey = useMemo(() => {
    if (!selectedWallet?.address) return null;
    try {
      return new PublicKey(selectedWallet.address);
    } catch {
      return null;
    }
  }, [selectedWallet]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      if (!authenticated) {
        await Promise.resolve(login({ loginMethods: ["wallet"], walletChainType: "solana-only" }));
        return;
      }

      if (walletsReady && !selectedWallet) {
        await createWallet({ createAdditional: false });
      }
    } finally {
      setConnecting(false);
    }
  }, [authenticated, createWallet, login, selectedWallet, walletsReady]);

  const disconnect = useCallback(async () => {
    await logout();
  }, [logout]);

  const signTransaction = useCallback(
    async (transaction: VersionedTransaction) => {
      if (!selectedWallet) {
        throw new Error("Connect a Privy Solana wallet before signing.");
      }

      const result = await privySignTransaction({
        transaction: transaction.serialize(),
        wallet: selectedWallet,
      });
      const signedTransaction = result instanceof Uint8Array ? result : result.signedTransaction;
      return VersionedTransaction.deserialize(signedTransaction);
    },
    [privySignTransaction, selectedWallet]
  );

  const value = useMemo<EmberWalletContextValue>(
    () => ({
      connection,
      publicKey,
      connected: ready && authenticated && Boolean(publicKey),
      connecting: connecting || !ready || (authenticated && !walletsReady),
      walletName: selectedWallet?.standardWallet?.name || "Privy",
      connect,
      disconnect,
      signTransaction: publicKey ? signTransaction : null,
    }),
    [authenticated, connect, connecting, connection, disconnect, publicKey, ready, selectedWallet, signTransaction, walletsReady]
  );

  return <EmberWalletContext.Provider value={value}>{children}</EmberWalletContext.Provider>;
}

function LegacyInjectedWalletProvider({ children }: { children: React.ReactNode }) {
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

  return <EmberWalletContext.Provider value={value}>{children}</EmberWalletContext.Provider>;
}

export function useEmberWallet() {
  const context = useContext(EmberWalletContext);
  if (!context) {
    throw new Error("useEmberWallet must be used inside AppProviders.");
  }
  return context;
}
