import { EMBER_IS_LIVE, EMBER_TOKEN } from "./token";

export const TREASURY_WALLET = "FZuJFAK4a7EqCrPZ6ZWnvLUvngoYyV7vN4mxWBcLYiFt";

const SEASON_LENGTH_DAYS = 15;
const SEASON_LENGTH_MS = SEASON_LENGTH_DAYS * 24 * 60 * 60 * 1000;
const FALLBACK_LAUNCH_AT = "2026-07-26T00:00:00.000Z";

export function getCurrentSeason(now = new Date()) {
  const launchAt = getLaunchDate();

  if (!launchAt) {
    return {
      label: "Pre-launch",
      start: now,
      end: new Date(now.getTime() + SEASON_LENGTH_MS),
      seasonIndex: 0,
      lengthDays: SEASON_LENGTH_DAYS,
    };
  }

  const elapsedMs = Math.max(0, now.getTime() - launchAt.getTime());
  const seasonIndex = Math.floor(elapsedMs / SEASON_LENGTH_MS);
  const start = new Date(launchAt.getTime() + seasonIndex * SEASON_LENGTH_MS);
  const end = new Date(start.getTime() + SEASON_LENGTH_MS);

  return {
    label: seasonIndex === 0 ? "Season Zero" : `Season ${seasonIndex}`,
    start,
    end,
    seasonIndex,
    lengthDays: SEASON_LENGTH_DAYS,
  };
}

function getLaunchDate() {
  if (!EMBER_IS_LIVE) return null;

  const configuredLaunchAt = EMBER_TOKEN.launchAt.trim() || FALLBACK_LAUNCH_AT;
  const launchAt = new Date(configuredLaunchAt);

  return Number.isNaN(launchAt.getTime()) ? new Date(FALLBACK_LAUNCH_AT) : launchAt;
}

export function formatSeasonDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
