export const SEASON_LENGTH_DAYS = 15;
export const CURRENT_SEASON_END_ISO = "2026-08-15T00:00:00.000Z";
export const TREASURY_WALLET = "FZuJFAK4a7EqCrPZ6ZWnvLUvngoYyV7vN4mxWBcLYiFt";

const seasonLengthMs = SEASON_LENGTH_DAYS * 24 * 60 * 60 * 1000;

export function getCurrentSeason(now = new Date()) {
  const firstEnd = new Date(CURRENT_SEASON_END_ISO).getTime();
  const nowMs = now.getTime();
  const cyclesAfterFirst = Math.max(0, Math.ceil((nowMs - firstEnd) / seasonLengthMs));
  const endMs = firstEnd + cyclesAfterFirst * seasonLengthMs;
  const startMs = endMs - seasonLengthMs;

  return {
    label: cyclesAfterFirst === 0 ? "Season Zero" : `Season ${cyclesAfterFirst}`,
    start: new Date(startMs),
    end: new Date(endMs),
    lengthDays: SEASON_LENGTH_DAYS,
  };
}

export function formatSeasonDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
