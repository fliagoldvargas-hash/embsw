"use client";

import { LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from "@solana/web3.js";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_SLIPPAGE_BPS, EMBER_MINT, SWAP_FEE_BPS } from "../lib/config";
import { DEFAULT_SWAP_TOKENS, type SwapToken } from "../lib/swap-tokens";
import { EMBER_IS_LIVE, EMBER_TOKEN } from "../lib/token";
import { useEmberWallet } from "../providers";

const contract = EMBER_MINT || "Paste mint in app/lib/token.ts";
const GUIDE_SEEN_KEY = "ember.swap.guideSeen";

type TokenSide = "pay" | "receive";

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
  const swapShellRef = useRef<HTMLElement | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [tokenSelectorSide, setTokenSelectorSide] = useState<TokenSide | null>(null);
  const [customMint, setCustomMint] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customTokenStatus, setCustomTokenStatus] = useState<"idle" | "loading" | "error">("idle");
  const [catalogTokens, setCatalogTokens] = useState<SwapToken[]>(DEFAULT_SWAP_TOKENS);
  const [customTokens, setCustomTokens] = useState<SwapToken[]>([]);
  const [copied, setCopied] = useState(false);
  const [payToken, setPayToken] = useState<SwapToken>(DEFAULT_SWAP_TOKENS[0]);
  const [receiveToken, setReceiveToken] = useState<SwapToken>(EMBER_MINT ? DEFAULT_SWAP_TOKENS[DEFAULT_SWAP_TOKENS.length - 1] : DEFAULT_SWAP_TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<"idle" | "loading" | "signing" | "sending" | "sent" | "confirmed" | "error">("idle");
  const [quoteError, setQuoteError] = useState("");
  const [signature, setSignature] = useState("");
  const [liveData, setLiveData] = useState<TokenLiveData | null>(null);

  const availableTokens = useMemo(() => dedupeTokens([...catalogTokens, ...customTokens]), [catalogTokens, customTokens]);
  const canQuote = Boolean(payToken.mint && receiveToken.mint && payToken.mint !== receiveToken.mint && amountNumber(amount) > 0);
  const isPrelaunch = !EMBER_IS_LIVE;
  const inputAmount = useMemo(() => toBaseUnits(amount, payToken.decimals), [amount, payToken.decimals]);
  const receiveValue = quote ? formatBaseUnits(quote.outAmount, receiveToken.decimals) : "";

  useEffect(() => {
    if (window.sessionStorage.getItem(GUIDE_SEEN_KEY)) return;

    setGuideOpen(true);
    window.sessionStorage.setItem(GUIDE_SEEN_KEY, "1");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshDefaultTokenMetadata() {
      const refreshed = await Promise.all(
        DEFAULT_SWAP_TOKENS.map(async (token) => {
          if (!token.mint || token.disabled) return token;
          return loadTokenMetadata(token.mint).catch(() => token);
        })
      );

      if (cancelled) return;

      setCatalogTokens(refreshed);
      setPayToken((token) => mergeTokenMetadata(token, refreshed));
      setReceiveToken((token) => mergeTokenMetadata(token, refreshed));
    }

    refreshDefaultTokenMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

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
    resetQuoteState();

    if (!wallet.connected) {
      await wallet.connect();
      return;
    }

    if (!payToken.mint || !receiveToken.mint) {
      setQuoteStatus("error");
      setQuoteError("This token is not live yet. Paste its mint before requesting real quotes.");
      return;
    }

    try {
      new PublicKey(payToken.mint);
      new PublicKey(receiveToken.mint);
    } catch {
      setQuoteStatus("error");
      setQuoteError("One of the selected token mints is not a valid Solana public key.");
      return;
    }

    if (!canQuote || !inputAmount) {
      setQuoteStatus("error");
      setQuoteError(payToken.mint === receiveToken.mint ? "Choose two different tokens." : "Enter an amount first.");
      return;
    }

    setQuoteStatus("loading");

    try {
      const params = new URLSearchParams({
        inputMint: payToken.mint,
        outputMint: receiveToken.mint,
        amount: inputAmount,
        slippageBps: String(DEFAULT_SLIPPAGE_BPS),
      });
      const response = await fetch(`/api/jupiter/quote?${params.toString()}`);
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Quote failed."));
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
    setSignature("");

    if (!quote || !wallet.publicKey) {
      await getQuote();
      return;
    }

    if (!wallet.signTransaction && !wallet.sendTransaction) {
      setQuoteStatus("error");
      setQuoteError("Your wallet does not expose transaction signing or sending in this browser.");
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
      const buildData = await readJsonResponse(buildResponse);

      if (!buildResponse.ok || !buildData?.swapTransaction) {
        throw new Error(getApiErrorMessage(buildData, "Swap transaction build failed."));
      }

      setQuoteStatus("sending");
      const transaction = VersionedTransaction.deserialize(base64ToBytes(buildData.swapTransaction));
      const txid = wallet.sendTransaction
        ? await wallet.sendTransaction(transaction)
        : await signAndBroadcastTransaction(transaction, wallet);

      setSignature(txid);
      const swapRecord = {
        signature: txid,
        wallet: wallet.publicKey.toBase58(),
        inputMint: payToken.mint,
        outputMint: receiveToken.mint,
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
      };

      setQuoteStatus("sent");
      recordConfirmedSwapWithRetry(swapRecord);
      await waitForConfirmedTransaction(wallet.connection, txid);
      recordConfirmedSwapWithRetry(swapRecord);
      setQuoteStatus("confirmed");
    } catch (error) {
      setQuoteStatus("error");
      setQuoteError(formatSwapError(error));
    }
  }

  function tradeEmber() {
    if (!EMBER_MINT) {
      setQuoteStatus("error");
      setQuoteError("$EMBER is not live yet. Add the mint after launch to enable direct Ember trading.");
      return;
    }

    const emberToken = availableTokens.find((token) => token.mint === EMBER_MINT);
    if (!emberToken || emberToken.disabled) {
      setQuoteStatus("error");
      setQuoteError("$EMBER is not available in the token list yet.");
      return;
    }

    setPayToken(DEFAULT_SWAP_TOKENS[0]);
    setReceiveToken(emberToken);
    resetQuoteState();
    window.setTimeout(() => {
      swapShellRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.querySelector<HTMLInputElement>(".amount-input")?.focus();
    }, 0);
  }

  function resetQuoteState() {
    setQuote(null);
    setQuoteError("");
    setSignature("");
  }

  function flipTokens() {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
    resetQuoteState();
  }

  function selectToken(token: SwapToken) {
    if (token.disabled) return;

    if (tokenSelectorSide === "pay") {
      setPayToken(token);
      if (token.mint === receiveToken.mint) {
        setReceiveToken(payToken);
      }
    }

    if (tokenSelectorSide === "receive") {
      setReceiveToken(token);
      if (token.mint === payToken.mint) {
        setPayToken(receiveToken);
      }
    }

    setTokenSelectorSide(null);
    resetQuoteState();
  }

  async function addCustomToken() {
    try {
      new PublicKey(customMint.trim());
    } catch {
      setCustomTokenStatus("error");
      setQuoteError("Custom token mint is not a valid Solana public key.");
      return;
    }

    setCustomTokenStatus("loading");
    setQuoteError("");

    try {
      const token = await loadTokenMetadata(customMint.trim());
      const tokenWithOverride = customSymbol.trim()
        ? { ...token, symbol: customSymbol.trim().toUpperCase().slice(0, 12) }
        : token;

      setCustomTokens((tokens) => dedupeTokens([...tokens, tokenWithOverride]));
      selectToken(tokenWithOverride);
      setCustomMint("");
      setCustomSymbol("");
      setCustomTokenStatus("idle");
    } catch (error) {
      setCustomTokenStatus("error");
      setQuoteError(error instanceof Error ? error.message : "Could not load token metadata.");
    }
  }

  const actionLabel = !wallet.connected
    ? "CONNECT WALLET"
    : quoteStatus === "loading"
      ? "GETTING QUOTE..."
      : quoteStatus === "signing"
        ? "SIGN IN WALLET..."
        : quoteStatus === "sending"
          ? "SENDING..."
          : quoteStatus === "sent"
            ? "TRANSACTION SENT"
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
          <p>{isPrelaunch ? "Best-route Solana swaps powered by Jupiter. Ember trading opens after the pump.fun launch." : "Best-route Solana swaps powered by Jupiter across live Solana DEX liquidity."}</p>
        </section>

        <section className="official-token">
          <div className="token-emblem">
            <Image src={EMBER_TOKEN.image} alt="Ember Swap logo" width={74} height={74} />
          </div>
          <div className="official-identity">
            <div>
              <p className="eyebrow">+ {isPrelaunch ? "PRE-LAUNCH TOKEN" : "LIVE TOKEN"}</p>
              <h2 className="logo-name">{EMBER_TOKEN.name}</h2>
              <span>{isPrelaunch ? "$EMBER launches on pump.fun soon. Mint will be published after launch." : "$EMBER is live. Data updates from Solana liquidity markets."}</span>
            </div>
          </div>
          <div className="token-stats">
            <span>PRICE <b>{formatUsd(liveData?.stats?.priceUsd) || (isPrelaunch ? "Pre-launch" : "Loading")}</b></span>
            <span>MARKET CAP <b>{formatCompactUsd(liveData?.stats?.marketCap) || "-"}</b></span>
            <span>24H VOLUME <b>{formatCompactUsd(liveData?.stats?.volume24h) || "-"}</b></span>
            <span>FEE <b>{formatBps(SWAP_FEE_BPS)}</b></span>
          </div>
          <div className="ca-status">
            <span>CA STATUS</span>
            <code>{isPrelaunch ? "Mint / CA pending pump.fun launch" : contract}</code>
          </div>
          <div className="token-actions">
            <button onClick={tradeEmber} disabled={!EMBER_MINT}>{EMBER_MINT ? "TRADE $EMBER" : "$EMBER PENDING"}</button>
            <button className="copy-ca" onClick={copyContract} disabled={!EMBER_MINT}>{copied ? "COPIED" : "COPY CONTRACT"}</button>
            {EMBER_TOKEN.pumpFunUrl ? (
              <Link href={EMBER_TOKEN.pumpFunUrl} target="_blank">Pump.fun -&gt;</Link>
            ) : null}
          </div>
        </section>

        <section className="swap-shell" ref={swapShellRef}>
          <header className="swap-head">
            <div>
              <p className="eyebrow">+ JUPITER ROUTING</p>
              <h2>Swap</h2>
            </div>
            <div className="route-badges">
              <span>MAINNET</span>
              <span>{formatBps(DEFAULT_SLIPPAGE_BPS)} SLIP</span>
            </div>
          </header>
          <SwapBox
            label="YOU PAY"
            meta={payToken.symbol === "SOL" ? `Balance ${solBalance === null ? "-" : solBalance.toFixed(4)}` : payToken.note || "Jupiter routed"}
            token={payToken}
            value={amount}
            onValueChange={(value) => {
              setAmount(value);
              resetQuoteState();
            }}
            onSelectToken={() => setTokenSelectorSide("pay")}
            editable
          />
          <button className="flip" aria-label="Flip tokens" onClick={flipTokens}>
            <svg className="flip-icon" viewBox="0 0 48 48" aria-hidden="true">
              <path
                d="M33.7 11.7c5.9 3.7 9 10.9 7.2 17.9"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="6"
              />
              <path d="M28.2 12.5 36.8 7l1.5 10.1Z" fill="currentColor" />
              <path
                d="M14.3 36.3c-5.9-3.7-9-10.9-7.2-17.9"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="6"
              />
              <path d="M19.8 35.5 11.2 41l-1.5-10.1Z" fill="currentColor" />
            </svg>
          </button>
          <SwapBox
            label="YOU RECEIVE"
            meta={receiveToken.note || (quote ? "Best route" : "Awaiting quote")}
            token={receiveToken}
            value={receiveValue}
            onSelectToken={() => setTokenSelectorSide("receive")}
          />
          <div className="swap-route-line">
            <span>Best available route</span>
            <b>{quote ? `${quote.routePlan?.length || 1} hop${quote.routePlan?.length === 1 ? "" : "s"}` : "Ready"}</b>
          </div>
          <dl className="fee-list">
            <div><dt>Ember fee</dt><dd>{formatBps(SWAP_FEE_BPS)}</dd></div>
            <div><dt>Slippage protection</dt><dd>{formatBps(DEFAULT_SLIPPAGE_BPS)}</dd></div>
            <div><dt>Price impact</dt><dd>{quote?.priceImpactPct ? `${Number(quote.priceImpactPct).toFixed(3)}%` : "-"}</dd></div>
          </dl>
          <div className="reward-line">$EMBER holder XP updates after confirmed swaps</div>
          {isPrelaunch && (
            <p className="swap-error">$EMBER is not live yet. Swaps for other listed tokens are already available.</p>
          )}
          {quoteError && <p className="swap-error">{quoteError}</p>}
          {signature && (
            <a className="tx-link" href={`https://solscan.io/tx/${signature}`} target="_blank">
              View transaction
            </a>
          )}
          <button className="swap-button" onClick={quote ? executeSwap : getQuote} disabled={quoteStatus === "loading" || quoteStatus === "signing" || quoteStatus === "sending" || quoteStatus === "sent"}>
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
      {tokenSelectorSide && (
        <TokenSelector
          side={tokenSelectorSide}
          tokens={availableTokens}
          selectedMint={tokenSelectorSide === "pay" ? payToken.mint : receiveToken.mint}
          oppositeMint={tokenSelectorSide === "pay" ? receiveToken.mint : payToken.mint}
          customMint={customMint}
          customSymbol={customSymbol}
          customTokenStatus={customTokenStatus}
          onCustomMintChange={setCustomMint}
          onCustomSymbolChange={setCustomSymbol}
          onAddCustomToken={addCustomToken}
          onSelect={selectToken}
          onClose={() => setTokenSelectorSide(null)}
        />
      )}
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
  onSelectToken,
}: {
  label: string;
  meta: string;
  token: SwapToken;
  value: string;
  editable?: boolean;
  onValueChange?: (value: string) => void;
  onSelectToken: () => void;
}) {
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
        <button className="token-button" onClick={onSelectToken}>
          <TokenIcon token={token} size={25} />
          {token.symbol}<span>v</span>
        </button>
      </div>
    </div>
  );
}

function TokenSelector({
  side,
  tokens,
  selectedMint,
  oppositeMint,
  customMint,
  customSymbol,
  customTokenStatus,
  onCustomMintChange,
  onCustomSymbolChange,
  onAddCustomToken,
  onSelect,
  onClose,
}: {
  side: TokenSide;
  tokens: SwapToken[];
  selectedMint: string;
  oppositeMint: string;
  customMint: string;
  customSymbol: string;
  customTokenStatus: "idle" | "loading" | "error";
  onCustomMintChange: (value: string) => void;
  onCustomSymbolChange: (value: string) => void;
  onAddCustomToken: () => void;
  onSelect: (token: SwapToken) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="token-selector-title">
      <section className="token-selector-modal">
        <button className="close" onClick={onClose} aria-label="Close">x</button>
        <p className="eyebrow">+ SELECT {side === "pay" ? "PAY" : "RECEIVE"} TOKEN</p>
        <h2 id="token-selector-title">Choose token</h2>
        <div className="token-list">
          {tokens.map((token) => {
            const isSelected = token.mint === selectedMint;
            const isOpposite = Boolean(token.mint && token.mint === oppositeMint);
            const disabled = token.disabled || isSelected;
            return (
              <button
                className={isSelected ? "token-option active" : "token-option"}
                key={`${token.symbol}-${token.mint || token.name}`}
                disabled={disabled}
                onClick={() => onSelect(token)}
              >
                <TokenIcon token={token} size={40} />
                <span>
                  <b>{token.symbol}</b>
                  <small>{token.name}</small>
                </span>
                <em>{token.note || (isOpposite ? "Current pair" : token.tags?.join(" / "))}</em>
              </button>
            );
          })}
        </div>
        <div className="custom-token-form">
          <input value={customSymbol} onChange={(event) => onCustomSymbolChange(event.target.value)} placeholder="SYMBOL" />
          <input
            value={customMint}
            onChange={(event) => onCustomMintChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onAddCustomToken();
            }}
            placeholder="Paste mint / CA"
          />
          <button onClick={onAddCustomToken} disabled={customTokenStatus === "loading"}>
            {customTokenStatus === "loading" ? "LOAD" : "ADD"}
          </button>
        </div>
      </section>
    </div>
  );
}

function TokenIcon({ token, size }: { token: SwapToken; size: number }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [token.image]);

  if (token.image && !imageFailed) {
    return <img className="token-icon" src={token.image} alt={`${token.symbol} logo`} width={size} height={size} onError={() => setImageFailed(true)} />;
  }

  return (
    <span className="token-initial" style={{ width: size, height: size }}>
      {token.symbol.slice(0, 2)}
    </span>
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

async function signAndBroadcastTransaction(transaction: VersionedTransaction, wallet: ReturnType<typeof useEmberWallet>) {
  if (!wallet.signTransaction) {
    throw new Error("Your wallet does not expose transaction signing in this browser.");
  }

  const signed = await wallet.signTransaction(transaction);
  const txid = await wallet.connection.sendRawTransaction(signed.serialize(), {
    maxRetries: 3,
    skipPreflight: false,
  });
  return txid;
}

async function waitForConfirmedTransaction(
  connection: ReturnType<typeof useEmberWallet>["connection"],
  signature: string
) {
  const confirmedByStatus = await waitForSignatureStatus(connection, signature, 45_000);
  if (confirmedByStatus) return;
}

async function waitForSignatureStatus(
  connection: ReturnType<typeof useEmberWallet>["connection"],
  signature: string,
  timeoutMs: number
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const verified = await readSignatureStatus(connection, signature);
    if (verified === "confirmed") return true;
    await new Promise((resolve) => window.setTimeout(resolve, 1_500));
  }

  return false;
}

async function readSignatureStatus(connection: ReturnType<typeof useEmberWallet>["connection"], signature: string) {
  const status = await connection.getSignatureStatuses([signature], {
    searchTransactionHistory: true,
  }).catch(() => null);
  const signatureStatus = status?.value[0];

  if (!signatureStatus) return "pending";

  if (signatureStatus.err) {
    throw new Error(`Transaction failed on-chain: ${JSON.stringify(signatureStatus.err)}`);
  }

  return signatureStatus.confirmationStatus === "confirmed" || signatureStatus.confirmationStatus === "finalized"
    ? "confirmed"
    : "pending";
}

async function readJsonResponse(response: Response) {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

async function loadTokenMetadata(mint: string): Promise<SwapToken> {
  const response = await fetch(`/api/jupiter/token?query=${encodeURIComponent(mint)}`);
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, "Could not load token metadata."));
  }

  return {
    symbol: String(data.symbol || "CUSTOM").toUpperCase(),
    name: String(data.name || "Custom token"),
    mint: String(data.mint || mint),
    decimals: Number(data.decimals || 6),
    image: typeof data.image === "string" ? data.image : undefined,
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 3) : ["custom"],
    note: typeof data.note === "string" ? data.note : "Custom token",
  };
}

function mergeTokenMetadata(token: SwapToken, metadata: SwapToken[]) {
  const match = metadata.find((item) => item.mint === token.mint);
  return match ? { ...token, ...match, tags: match.tags?.length ? match.tags : token.tags } : token;
}

function dedupeTokens(tokens: SwapToken[]) {
  const seen = new Set<string>();
  return tokens.filter((token) => {
    const key = token.mint || token.symbol;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getApiErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data.details === "string") return data.details;
  if (typeof data.details?.error === "string") return data.details.error;
  if (typeof data.error === "string") return data.error;
  if (typeof data.raw === "string") return data.raw.slice(0, 220);
  return fallback;
}

function formatSwapError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (/insufficient|0x1|custom program error: 1/i.test(message)) {
    return "Insufficient SOL for this swap. Keep extra SOL for network fees and token-account rent, then try a smaller amount.";
  }

  if (/blockhash|expired/i.test(message)) {
    return "The quote expired before signing. Get a fresh quote and approve it right away.";
  }

  if (/user rejected|rejected|denied|cancel/i.test(message)) {
    return "Transaction cancelled in wallet.";
  }

  if (/prepare|preparing/i.test(message)) {
    return "Wallet could not prepare this transaction. Try refreshing, reconnecting the wallet, and swapping a smaller SOL amount.";
  }

  return message || "Swap failed.";
}

function recordConfirmedSwapWithRetry(input: {
  signature: string;
  wallet: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
}) {
  void retrySwapRecord(input);
}

async function retrySwapRecord(input: {
  signature: string;
  wallet: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
}) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const saved = await recordConfirmedSwap(input);
    if (saved) return;
    await new Promise((resolve) => window.setTimeout(resolve, 2_000 + attempt * 1_000));
  }
}

async function recordConfirmedSwap(input: {
  signature: string;
  wallet: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
}) {
  try {
    const response = await fetch("/api/xp/swaps", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return response.ok;
  } catch {
    // XP persistence must not block a confirmed swap.
    return false;
  }
}
