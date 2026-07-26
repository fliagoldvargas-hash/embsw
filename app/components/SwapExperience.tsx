"use client";

import { LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from "@solana/web3.js";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SLIPPAGE_BPS, EMBER_DECIMALS, EMBER_MINT, SOL_MINT, SWAP_FEE_BPS } from "../lib/config";
import { EMBER_IS_LIVE, EMBER_TOKEN } from "../lib/token";
import { useEmberWallet } from "../providers";

const contract = EMBER_MINT || "Paste mint in app/lib/token.ts";

type TokenSymbol = "SOL" | "EMBER";

type JupiterQuote = {
  inAmount: string;
  outAmount: string;
  priceImpactPct?: string;
  routePlan?: unknown[];
};

type TokenLiveData = {
  live: boolean;
  stats: null | {
    dexUrl?: string | null;
    priceUsd?: string | null;
    volume24h?: number | null;
    liquidityUsd?: number | null;
    marketCap?: number | null;
  };
};

export function SwapExperience() {
  const wallet = useEmberWallet();
  const [guideOpen, setGuideOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [amount, setAmount] = useState("");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<"idle" | "loading" | "signing" | "sending" | "confirmed" | "error">("idle");
  const [quoteError, setQuoteError] = useState("");
  const [signature, setSignature] = useState("");
  const [liveData, setLiveData] = useState<TokenLiveData | null>(null);

  const pay: TokenSymbol = flipped ? "EMBER" : "SOL";
  const receive: TokenSymbol = flipped ? "SOL" : "EMBER";
  const canQuote = Boolean(EMBER_MINT && amountNumber(amount) > 0);
  const isPrelaunch = !EMBER_IS_LIVE;

  const inputMint = pay === "SOL" ? SOL_MINT : EMBER_MINT;
  const outputMint = receive === "SOL" ? SOL_MINT : EMBER_MINT;
  const inputDecimals = pay === "SOL" ? 9 : EMBER_DECIMALS;
  const outputDecimals = receive === "SOL" ? 9 : EMBER_DECIMALS;
  const inputAmount = useMemo(() => toBaseUnits(amount, inputDecimals), [amount, inputDecimals]);
  const receiveValue = quote ? formatBaseUnits(quote.outAmount, outputDecimals) : "";

  useEffect(() => {
    let cancelled = false;

    async function loadBalance() {
      if (!wallet.publicKey) {
        setSolBalance(null);
        return;
      }

      const lamports = await wallet.connection.getBalance(wallet.publicKey);
      if (!cancelled) {
        setSolBalance(lamports / LAMPORTS_PER_SOL);
      }
    }

    loadBalance().catch(() => {
      if (!cancelled) setSolBalance(null);
    });

    return () => {
      cancelled = true;
    };
  }, [wallet.connection, wallet.publicKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveData() {
      const response = await fetch("/api/token/live");
      const data = await response.json();
      if (!cancelled) {
        setLiveData(data);
      }
    }

    loadLiveData().catch(() => {
      if (!cancelled) setLiveData(null);
    });

    const interval = window.setInterval(loadLiveData, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function copyContract() {
    try {
      await navigator.clipboard.writeText(contract);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(true);
    }
  }

  async function getQuote() {
      setQuote(null);
      setQuoteError("");

    if (!wallet.connected) {
      await wallet.connect();
      return;
    }

    if (!EMBER_MINT) {
      setQuoteStatus("error");
      setQuoteError("Paste the EMBER mint in app/lib/token.ts before requesting real quotes.");
      return;
    }

    try {
      new PublicKey(EMBER_MINT);
    } catch {
      setQuoteStatus("error");
      setQuoteError("Configured EMBER mint is not a valid Solana public key.");
      return;
    }

    if (!canQuote || !inputAmount) {
      setQuoteStatus("error");
      setQuoteError("Enter an amount first.");
      return;
    }

    setQuoteStatus("loading");

    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: inputAmount,
        slippageBps: String(DEFAULT_SLIPPAGE_BPS),
      });
      const response = await fetch(`/api/jupiter/quote?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.details?.error || data?.error || "Quote failed.");
      }

      setQuote(data);
      setSignature("");
      setQuoteStatus("idle");
    } catch (error) {
      setQuoteStatus("error");
      setQuoteError(error instanceof Error ? error.message : "Quote failed.");
    }
  }

  async function executeSwap() {
    setQuoteError("");

    if (!quote || !wallet.publicKey) {
      await getQuote();
      return;
    }

    if (!wallet.signTransaction) {
      setQuoteStatus("error");
      setQuoteError("Your wallet does not expose transaction signing in this browser.");
      return;
    }

    setQuoteStatus("signing");

    try {
      const buildResponse = await fetch("/api/jupiter/swap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: wallet.publicKey.toBase58(),
        }),
      });
      const buildData = await buildResponse.json();

      if (!buildResponse.ok || !buildData?.swapTransaction) {
        throw new Error(buildData?.details?.error || buildData?.error || "Swap transaction build failed.");
      }

      const transaction = VersionedTransaction.deserialize(base64ToBytes(buildData.swapTransaction));
      const signed = await wallet.signTransaction(transaction);

      setQuoteStatus("sending");
      const txid = await wallet.connection.sendRawTransaction(signed.serialize(), {
        maxRetries: 3,
        skipPreflight: false,
      });
      await wallet.connection.confirmTransaction(txid, "confirmed");

      setSignature(txid);
      setQuoteStatus("confirmed");
    } catch (error) {
      setQuoteStatus("error");
      setQuoteError(error instanceof Error ? error.message : "Swap failed.");
    }
  }

  function flipTokens() {
    setFlipped((value) => !value);
    setQuote(null);
    setQuoteError("");
    setSignature("");
  }

  const actionLabel = !wallet.connected
    ? "CONNECT WALLET"
    : quoteStatus === "loading"
      ? "GETTING QUOTE..."
      : quoteStatus === "signing"
        ? "SIGN IN WALLET..."
        : quoteStatus === "sending"
          ? "SENDING..."
          : quoteStatus === "confirmed"
            ? "SWAP CONFIRMED"
      : quote
        ? "SWAP"
        : "GET QUOTE";

  return (
    <>
      <button className="floating-guide" onClick={() => setGuideOpen(true)}>How it works</button>
      <main className={guideOpen ? "home-page blurred" : "home-page"}>
        <section className="hero">
          <p className="eyebrow">+ MEMECOIN LIQUIDITY, UNLEASHED</p>
          <h1>
            <span>Swap fast.</span>
            <span>Stay unhinged.</span>
          </h1>
          <p>Best-route Solana swaps powered by Jupiter. Ember trading opens after the pump.fun launch.</p>
        </section>

        <section className="official-token">
          <div className="official-identity">
            <Image src="/assets/ember-swap-logo.png" alt="Ember Swap logo" width={44} height={44} />
            <div>
              <p className="eyebrow">+ PRE-LAUNCH TOKEN</p>
              <h2 className="logo-name">{EMBER_TOKEN.name.split(" ")[0]} <span>Swap</span></h2>
              <span>{isPrelaunch ? "EMBER launches on pump.fun soon. Mint will be published after launch." : "EMBER is live. Data updates from Solana liquidity markets."}</span>
            </div>
          </div>
          <div className="token-stats">
            <span>PRICE <b>{formatUsd(liveData?.stats?.priceUsd) || (isPrelaunch ? "Pre-launch" : "Loading")}</b></span>
            <span>MARKET CAP <b>{formatCompactUsd(liveData?.stats?.marketCap) || "-"}</b></span>
            <span>24H VOLUME <b>{formatCompactUsd(liveData?.stats?.volume24h) || "-"}</b></span>
            <span>FEE <b>{formatBps(SWAP_FEE_BPS)}</b></span>
          </div>
          <div className="token-actions">
            <button onClick={() => document.querySelector<HTMLInputElement>(".amount-input")?.focus()}>TRADE EMBER</button>
            <button className="copy-ca" onClick={copyContract}>{copied ? "COPIED" : "COPY CONTRACT"}</button>
            <Link href={EMBER_TOKEN.pumpFunUrl || "/"} target={EMBER_TOKEN.pumpFunUrl ? "_blank" : undefined}>Pump.fun -&gt;</Link>
            <Link href={EMBER_MINT ? `https://solscan.io/token/${EMBER_MINT}` : "/"} target={EMBER_MINT ? "_blank" : undefined}>Solscan -&gt;</Link>
          </div>
          <code>{isPrelaunch ? "Mint/CA pending pump.fun launch. Paste it in app/lib/token.ts." : contract}</code>
        </section>

        <section className="swap-shell">
          <header className="swap-head">
            <h2>Swap</h2>
            <button className="settings" aria-label="Settings">...</button>
          </header>
          <button className="search-pill">SEARCH</button>
          <SwapBox
            label="YOU PAY"
            meta={pay === "SOL" ? `Balance ${solBalance === null ? "-" : solBalance.toFixed(4)}` : "Balance -"}
            token={pay}
            value={amount}
            onValueChange={(value) => {
              setAmount(value);
              setQuote(null);
              setQuoteError("");
              setSignature("");
            }}
            editable
          />
          <button className="flip" aria-label="Flip tokens" onClick={flipTokens}>⇅</button>
          <SwapBox label="YOU RECEIVE" meta={quote ? "Best route" : "Awaiting quote"} token={receive} value={receiveValue} />
          <div className="reward-line">Season Zero rewards <b>+10 XP</b> after confirmation</div>
          <dl className="fee-list">
            <div><dt>Ember fee <button className="info-dot">?</button></dt><dd>{formatBps(SWAP_FEE_BPS)}</dd></div>
            <div><dt>Slippage protection</dt><dd>{formatBps(DEFAULT_SLIPPAGE_BPS)}</dd></div>
            <div><dt>Price impact</dt><dd>{quote?.priceImpactPct ? `${Number(quote.priceImpactPct).toFixed(3)}%` : "-"}</dd></div>
          </dl>
          {isPrelaunch && (
            <p className="swap-error">EMBER is not live yet. Swaps unlock as soon as the pump.fun mint is pasted in app/lib/token.ts.</p>
          )}
          {quoteError && <p className="swap-error">{quoteError}</p>}
          {signature && (
            <a className="tx-link" href={`https://solscan.io/tx/${signature}`} target="_blank">
              View confirmed transaction
            </a>
          )}
          <button className="swap-button" onClick={quote ? executeSwap : getQuote} disabled={quoteStatus === "loading" || quoteStatus === "signing" || quoteStatus === "sending"}>
            {actionLabel} -&gt;
          </button>
          <p className="powered">Powered by Jupiter routing - Mainnet tokens - DYOR</p>
        </section>
      </main>
      <footer>
        <span>Trade responsibly. Memecoins are highly volatile.</span>
        <span><a href="/" target="_blank">Ember Swap</a> - Built on <b>Solana</b></span>
      </footer>
      {guideOpen && <GuideModal onClose={() => setGuideOpen(false)} />}
    </>
  );
}

function SwapBox({
  label,
  meta,
  token,
  value,
  editable = false,
  onValueChange,
}: {
  label: string;
  meta: string;
  token: TokenSymbol;
  value: string;
  editable?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const image = token === "SOL" ? "/assets/solana.png" : "/assets/ember-swap-logo.png";

  return (
    <div className="swap-box">
      <div>
        <p>{label}</p>
        <span>{meta}</span>
      </div>
      <div className="amount-row">
        {editable ? (
          <input
            className="amount-input"
            inputMode="decimal"
            placeholder="0.00"
            value={value}
            onChange={(event) => onValueChange?.(sanitizeAmount(event.target.value))}
          />
        ) : (
          <strong>{value || "0.00"}</strong>
        )}
        <button className="token-button">
          <Image src={image} alt={`${token} logo`} width={25} height={25} />
          {token}<span>v</span>
        </button>
      </div>
    </div>
  );
}

function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <section className="guide-modal">
        <button className="close" onClick={onClose} aria-label="Close">x</button>
        <p className="eyebrow">60-SECOND GUIDE</p>
        <h2 id="guide-title">Know before you swap</h2>
        {[
          ["You stay in control", "Ember Swap never sees your recovery phrase. Your wallet previews and signs every transaction."],
          ["Network costs only", "Ember Swap currently charges no platform fee. Solana may reserve about 0.002 SOL when your wallet needs a new token account."],
          ["Account rent is recoverable", "After selling or transferring every token out, close the empty token account using a trusted wallet's account-management feature. The reserved SOL returns to your wallet."],
        ].map(([title, body], index) => (
          <article className="guide-step" key={title}>
            <b>{index + 1}</b>
            <div><h3>{title}</h3><p>{body}</p></div>
          </article>
        ))}
        <aside className="guide-warning">Never close an account that still contains tokens. Never enter your recovery phrase into an account-cleanup website.</aside>
        <button className="swap-button" onClick={onClose}>GOT IT - START SMALL</button>
      </section>
    </div>
  );
}

function sanitizeAmount(value: string) {
  return value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

function amountNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBaseUnits(value: string, decimals: number) {
  if (!value || amountNumber(value) <= 0) return "";
  const [whole, fraction = ""] = value.split(".");
  const padded = `${fraction}${"0".repeat(decimals)}`.slice(0, decimals);
  return `${whole || "0"}${padded}`.replace(/^0+(?=\d)/, "");
}

function formatBaseUnits(value: string, decimals: number) {
  const padded = value.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction.slice(0, 6)}` : whole;
}

function formatBps(bps: number) {
  return `${(bps / 100).toFixed(2)}%`;
}

function formatUsd(value?: string | null) {
  if (!value) return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (number < 0.01) return `$${number.toFixed(8)}`;
  return `$${number.toFixed(4)}`;
}

function formatCompactUsd(value?: number | null) {
  if (!value || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
