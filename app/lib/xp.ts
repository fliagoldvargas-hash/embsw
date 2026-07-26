import { isSupabaseConfigured, supabaseRest } from "./supabase";

export type XpWalletSummary = {
  wallet: string;
  totalXp: number;
  totalSwaps: number;
  todaySwaps: number;
  activeDays: number;
  lastSwapAt: string | null;
};

export type XpLeaderboardRow = {
  wallet: string;
  totalXp: number;
  totalSwaps: number;
  activeDays: number;
  lastSwapAt: string | null;
};

type XpWalletRow = {
  wallet: string;
  total_xp: number | null;
  total_swaps: number | null;
  active_days: number | null;
  last_swap_at: string | null;
};

type XpSwapRow = {
  signature: string;
  wallet: string;
  swap_day?: string | null;
  xp_awarded?: number | null;
};

export const DAILY_BONUS_SWAP_LIMIT = 5;
export const DAILY_BONUS_XP = 10;
export const BASE_SWAP_XP = 1;

export function emptyXpSummary(wallet = ""): XpWalletSummary {
  return {
    wallet,
    totalXp: 0,
    totalSwaps: 0,
    todaySwaps: 0,
    activeDays: 0,
    lastSwapAt: null,
  };
}

export async function recordXpSwap(input: {
  signature: string;
  wallet: string;
  inputMint?: string;
  outputMint?: string;
  inAmount?: string;
  outAmount?: string;
}) {
  if (!isSupabaseConfigured()) {
    return { configured: false, summary: emptyXpSummary(input.wallet), swap: null };
  }

  const existing = await supabaseRest<XpSwapRow[]>(
    `xp_swaps?signature=eq.${encodeURIComponent(input.signature)}&select=signature,wallet,xp_awarded`
  );

  if (existing.length > 0) {
    return {
      configured: true,
      summary: await getWalletXpSummary(input.wallet),
      swap: existing[0],
      duplicate: true,
    };
  }

  const rows = await supabaseRest<XpSwapRow[]>("xp_swaps", {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({
      signature: input.signature,
      wallet: input.wallet,
      input_mint: input.inputMint || null,
      output_mint: input.outputMint || null,
      in_amount: input.inAmount || null,
      out_amount: input.outAmount || null,
    }),
  });

  return {
    configured: true,
    summary: await getWalletXpSummary(input.wallet),
    swap: rows[0] || null,
    duplicate: false,
  };
}

export async function getWalletXpSummary(wallet: string): Promise<XpWalletSummary> {
  if (!isSupabaseConfigured()) return emptyXpSummary(wallet);

  const [walletRows, todayRows] = await Promise.all([
    supabaseRest<XpWalletRow[]>(
      `xp_wallets?wallet=eq.${encodeURIComponent(wallet)}&select=wallet,total_xp,total_swaps,active_days,last_swap_at&limit=1`
    ),
    supabaseRest<XpSwapRow[]>(
      `xp_swaps?wallet=eq.${encodeURIComponent(wallet)}&swap_day=eq.${getUtcDay()}&select=signature`
    ),
  ]);

  const row = walletRows[0];
  if (!row) return emptyXpSummary(wallet);

  return {
    wallet: row.wallet,
    totalXp: Number(row.total_xp || 0),
    totalSwaps: Number(row.total_swaps || 0),
    todaySwaps: todayRows.length,
    activeDays: Number(row.active_days || 0),
    lastSwapAt: row.last_swap_at,
  };
}

export async function getXpLeaderboard(limit = 10): Promise<XpLeaderboardRow[]> {
  if (!isSupabaseConfigured()) return [];

  const rows = await supabaseRest<XpWalletRow[]>(
    `xp_wallets?select=wallet,total_xp,total_swaps,active_days,last_swap_at&order=total_xp.desc,total_swaps.desc&limit=${limit}`
  );

  return rows.map((row) => ({
    wallet: row.wallet,
    totalXp: Number(row.total_xp || 0),
    totalSwaps: Number(row.total_swaps || 0),
    activeDays: Number(row.active_days || 0),
    lastSwapAt: row.last_swap_at,
  }));
}

function getUtcDay() {
  return new Date().toISOString().slice(0, 10);
}
