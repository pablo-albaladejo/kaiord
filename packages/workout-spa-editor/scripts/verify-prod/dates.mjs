// ISO 8601 week id (`2026-W41`) of a `YYYY-MM-DD` day, as the SPA routes it.
export function weekIdOf(day) {
  const thursday = new Date(`${day}T12:00:00Z`);
  const offset = 3 - ((thursday.getUTCDay() + 6) % 7);
  thursday.setUTCDate(thursday.getUTCDate() + offset);
  const year = thursday.getUTCFullYear();
  const dayOfYear = (thursday - Date.UTC(year, 0, 1)) / 86_400_000;
  const week = Math.floor(dayOfYear / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}
