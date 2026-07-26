# Ember Swap XP setup

## 1. Environment variables

Add these variables in Vercel and in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in client code. It is only read from Next.js API routes and server components.

## 2. Supabase SQL

Open Supabase SQL Editor and run this once:

```sql
create table if not exists public.xp_swaps (
  signature text primary key,
  wallet text not null,
  input_mint text,
  output_mint text,
  in_amount text,
  out_amount text,
  xp_awarded integer not null default 0,
  swap_day date not null default (timezone('utc', now())::date),
  created_at timestamptz not null default now()
);

create table if not exists public.xp_wallets (
  wallet text primary key,
  total_xp integer not null default 0,
  total_swaps integer not null default 0,
  active_days integer not null default 0,
  last_swap_at timestamptz
);

create index if not exists xp_swaps_wallet_day_idx
  on public.xp_swaps (wallet, swap_day);

create or replace function public.set_xp_award()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.swap_day := timezone('utc', coalesce(new.created_at, now()))::date;
  new.xp_awarded := greatest(coalesce(new.xp_awarded, 0), 0);
  return new;
end;
$$;

create or replace function public.refresh_xp_wallet()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.xp_wallets (wallet, total_xp, total_swaps, active_days, last_swap_at)
  select
    new.wallet,
    coalesce(sum(xp_awarded), 0)::integer,
    count(*)::integer,
    count(distinct swap_day)::integer,
    max(created_at)
  from public.xp_swaps
  where wallet = new.wallet
  group by wallet
  on conflict (wallet) do update set
    total_xp = excluded.total_xp,
    total_swaps = excluded.total_swaps,
    active_days = excluded.active_days,
    last_swap_at = excluded.last_swap_at;

  return new;
end;
$$;

drop trigger if exists xp_swaps_set_award on public.xp_swaps;
create trigger xp_swaps_set_award
before insert on public.xp_swaps
for each row execute function public.set_xp_award();

drop trigger if exists xp_swaps_refresh_wallet on public.xp_swaps;
create trigger xp_swaps_refresh_wallet
after insert on public.xp_swaps
for each row execute function public.refresh_xp_wallet();

alter table public.xp_swaps enable row level security;
alter table public.xp_wallets enable row level security;
```

The app writes through the server-side service role key, so public insert/update policies are not needed.

## 3. Season Zero XP rules

- Confirmed swaps are saved in `xp_swaps` after on-chain signature verification.
- Ranking totals are stored in `xp_wallets` and refreshed by the app after every saved swap.
- XP is holder-gated: the API reads the wallet's live `$EMBER` balance before awarding points.
- No `$EMBER`: the swap is saved, but earns `0 XP`.
- Tier 3, `1,000,000` to `9,999,999 $EMBER`: x1 XP.
- Tier 2, `10,000,000` to `19,999,999 $EMBER`: x1.5 XP.
- Tier 1, `20,000,000+ $EMBER`: x3 XP.
- First five eligible holder swaps per wallet per UTC day use `10` base XP.
- Additional eligible holder swaps use `1` base XP.
- Duplicate transaction signature: ignored.
- Failed on-chain transaction: ignored.
- Transaction not signed by the connected wallet: ignored.

## 4. Reward system draft

- Level 1, Spark: `100 XP`, allowlist priority.
- Level 2, Flame: `500 XP`, boosted raffle weight.
- Level 3, Forge: `1,500 XP`, fee rebate window or merch/role reward.
- Level 4, Inferno: top 50 wallets, special badge and higher campaign allocation.

Keep rewards non-promissory until legal/tokenomics are final: XP should say it has no guaranteed cash value or guaranteed token conversion.
