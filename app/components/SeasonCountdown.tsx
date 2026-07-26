"use client";

import { useEffect, useMemo, useState } from "react";

export function SeasonCountdown({ endsAt }: { endsAt: string }) {
  const target = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const remaining = Math.max(0, target - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return (
    <div className="season-countdown" aria-label="Season countdown">
      <span>Season ends in</span>
      <strong>{days}d {hours}h {minutes}m {seconds}s</strong>
    </div>
  );
}
