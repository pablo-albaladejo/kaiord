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

const DAY_MS = 86_400_000;

// Every day of a `count`-day window ending on `today`, labelled the way the
// app labels its chart ticks (es, UTC midnights) and mapped to its offset from
// the window's first day. The labels come from the page's Intl: its ICU can
// word a month differently from Node's ("sept" against "sep").
export async function windowDayOffsets(page, today, count) {
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const labels = await page.evaluate(
    ({ end, count, dayMs }) => {
      const format = new Intl.DateTimeFormat("es", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
      return Array.from({ length: count }, (_, i) =>
        format.format(end - (count - 1 - i) * dayMs)
      );
    },
    { end, count, dayMs: DAY_MS }
  );
  return new Map(labels.map((label, offset) => [label, offset]));
}
