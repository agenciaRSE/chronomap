// Jet lag estimates using the average adaptation rates in the CDC Yellow Book 2026:
// 1 hour per day after flying east, 1.5 hours per day after flying west.
// https://www.cdc.gov/yellow-book/hcp/travel-air-sea/jet-lag-disorder.html

export const RATE_EAST = 1;
export const RATE_WEST = 1.5;

const wrapDay = (min: number) => ((min % 1440) + 1440) % 1440;

// Offsets in minutes east of UTC. A gap over 12 hours is counted the shorter way round
// the clock: Los Angeles to Sydney is 6 hours west on the body clock, not 18 hours east.
export function estimate(fromOffMin: number, toOffMin: number) {
  let diff = (toOffMin - fromOffMin) / 60;
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  const crossed = Math.round(Math.abs(diff));
  const east = diff > 0;
  const days = crossed === 0 ? 0 : Math.ceil(crossed / (east ? RATE_EAST : RATE_WEST));
  const severity = crossed === 0 ? 'none' : crossed <= 2 ? 'mild' : crossed <= 5 ? 'moderate' : 'severe';
  return { crossed, east, days, severity };
}

// Bedtimes for the 2-3 days before the flight, shifting one hour per day (CDC), minutes of day.
export function preFlightBedtimes(crossed: number, east: boolean, bedMin: number): number[] {
  const steps = Math.min(3, crossed);
  return Array.from({ length: steps }, (_, i) => wrapDay(bedMin + (east ? -1 : 1) * (i + 1) * 60));
}

// Day-by-day estimate after landing, without any pre-flight shift. `gap` is how far the
// body clock is still off; `sleepy` is when the usual bedtime falls on the local clock.
export function dailyPlan(crossed: number, east: boolean, bedMin: number) {
  const rate = east ? RATE_EAST : RATE_WEST;
  const rows: { day: number; gap: number; sleepy: number }[] = [];
  for (let day = 1; ; day++) {
    const gap = Math.max(0, crossed - rate * (day - 1));
    rows.push({ day, gap, sleepy: wrapDay(bedMin + (east ? 1 : -1) * gap * 60) });
    if (gap === 0 || crossed === 0) return rows;
  }
}
