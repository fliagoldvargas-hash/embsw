export const TREASURY_WALLET = "FZuJFAK4a7EqCrPZ6ZWnvLUvngoYyV7vN4mxWBcLYiFt";

export function getCurrentSeason(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const monthEndDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const isFirstHalf = day <= 15;

  const start = isFirstHalf
    ? new Date(Date.UTC(year, month, 1))
    : new Date(Date.UTC(year, month, 16));
  const end = isFirstHalf
    ? new Date(Date.UTC(year, month, 15, 23, 59, 59, 999))
    : new Date(Date.UTC(year, month, monthEndDay, 23, 59, 59, 999));

  return {
    label: "Season Zero",
    start,
    end,
    payoutLabel: isFirstHalf ? "15th" : "last day",
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
