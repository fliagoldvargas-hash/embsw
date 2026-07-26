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
  created_at?: string | null;
};

export const DAILY_BONUS_SWAP_LIMIT = 5;
export const DAILY_BONUS_XP = 10;
export const BASE_SWAP_XP = 1;

export type EmberHolderTier = "none" | "bronze" | "silver" | "gold";

export type EmberHolderSnapshot = {
  balance: number;
  tier: EmberHolderTier;
  multiplier: number;
};

export function getEmberHolderSnapshot(balance: number): EmberHolderSnapshot {
  if (balance >= 20_000_000) {
    return { balance, tier: "gold", multiplier: 3 };
  }

  if (balance >= 10_000_000) {
    return { balance, tier: "silver", multiplier: 1.5 };
  }

  if (balance >= 1_000_000) {
    return { balance, tier: "bronze", multiplier: 1 };
  }

  return { balance, tier: "none", multiplier: 0 };
}

export function calculateSwapXp(holder: EmberHolderSnapshot, earnedSwapsToday: number) {
  if (holder.tier === "none") return 0;

  const baseXp = earnedSwapsToday < DAILY_BONUS_SWAP_LIMIT ? DAILY_BONUS_XP : BASE_SWAP_XP;
  return Math.max(0, Math.round(baseXp * holder.multiplier));
}

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
  xpAwarded: number;
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
      xp_awarded: input.xpAwarded,
    }),
  });

  await supabaseRest<XpSwapRow[]>(`xp_swaps?signature=eq.${encodeURIComponent(input.signature)}`, {
    method: "PATCH",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({ xp_awarded: input.xpAwarded }),
  });

  await refreshWalletXpSummary(input.wallet);

  return {
    configured: true,
    summary: await getWalletXpSummary(input.wallet),
    swap: rows[0] || null,
    duplicate: false,
  };
}

export async function getEarnedSwapsToday(wallet: string) {
  if (!isSupabaseConfigured()) return 0;

  const rows = await supabaseRest<XpSwapRow[]>(
    `xp_swaps?wallet=eq.${encodeURIComponent(wallet)}&swap_day=eq.${getUtcDay()}&xp_awarded=gt.0&select=signature`
  );

  return rows.length;
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

async function refreshWalletXpSummary(wallet: string) {
  const swaps = await supabaseRest<XpSwapRow[]>(
    `xp_swaps?wallet=eq.${encodeURIComponent(wallet)}&select=signature,swap_day,xp_awarded,created_at`
  );

  const activeDays = new Set(swaps.map((swap) => swap.swap_day).filter(Boolean));
  const totalXp = swaps.reduce((sum, swap) => sum + Number(swap.xp_awarded || 0), 0);
  const lastSwapAt = swaps
    .map((swap) => swap.created_at)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  await supabaseRest("xp_wallets", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      wallet,
      total_xp: totalXp,
      total_swaps: swaps.length,
      active_days: activeDays.size,
      last_swap_at: lastSwapAt,
    }),
  });
}
