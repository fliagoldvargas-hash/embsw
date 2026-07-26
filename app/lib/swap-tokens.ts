import { EMBER_TOKEN } from "./token";

export type SwapToken = {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  image?: string;
  tags?: string[];
  disabled?: boolean;
  note?: string;
};

export const SOL_TOKEN: SwapToken = {
  symbol: "SOL",
  name: "Solana",
  mint: "So11111111111111111111111111111111111111112",
  decimals: 9,
  image: "/assets/solana.png",
  tags: ["native"],
};

export const EMBER_SWAP_TOKEN: SwapToken = {
  symbol: EMBER_TOKEN.symbol,
  name: EMBER_TOKEN.name,
  mint: EMBER_TOKEN.mint,
  decimals: EMBER_TOKEN.decimals,
  image: EMBER_TOKEN.image,
  tags: ["official"],
  disabled: !EMBER_TOKEN.mint,
  note: EMBER_TOKEN.mint ? undefined : "Mint pending launch",
};

export const DEFAULT_SWAP_TOKENS: SwapToken[] = [
  SOL_TOKEN,
  {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    tags: ["stable"],
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
    tags: ["verified"],
  },
  {
    symbol: "FARTCOIN",
    name: "Fartcoin",
    mint: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
    decimals: 6,
    tags: ["pump.fun"],
  },
  {
    symbol: "PNUT",
    name: "Peanut the Squirrel",
    mint: "2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump",
    decimals: 6,
    tags: ["pump.fun"],
  },
  {
    symbol: "BAN",
    name: "Comedian",
    mint: "9PR7nCP9DpcUotnDPVLUBUZKu5WAYkwrCUx9wDnSpump",
    decimals: 6,
    tags: ["pump.fun"],
  },
  {
    symbol: "ANSEM",
    name: "The Black Bull",
    mint: "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
    decimals: 6,
    tags: ["pump.fun"],
  },
  EMBER_SWAP_TOKEN,
];

export function makeCustomSwapToken(mint: string, symbol = "CUSTOM", decimals = 6): SwapToken {
  return {
    symbol: symbol.trim().toUpperCase() || "CUSTOM",
    name: "Custom token",
    mint: mint.trim(),
    decimals,
    tags: ["custom"],
  };
}
