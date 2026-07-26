# Privy Setup

Add these environment variables before enabling Privy in production:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
```

Where to put them:

- Local development: `.env.local`
- Vercel production: Project Settings -> Environment Variables

`NEXT_PUBLIC_PRIVY_APP_ID` is safe for the browser. `PRIVY_APP_SECRET` is server-only and must never be prefixed with `NEXT_PUBLIC_`.

The app uses Privy as soon as `NEXT_PUBLIC_PRIVY_APP_ID` exists. If it is missing, Ember Swap falls back to the previous injected Solana wallet flow.
