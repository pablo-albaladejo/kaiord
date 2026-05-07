/**
 * "Creating workout for <date>" banner shown above the new-workout
 * editor when the route includes a `?date=YYYY-MM-DD` param. Returns
 * `null` for unparseable input — the calendar links always pass a
 * well-formed date but defensive parsing protects against manual URL
 * edits.
 */

export type DateBannerProps = {
  date: string;
};

export function DateBanner({ date }: DateBannerProps) {
  const parsed = new Date(date + "T12:00:00Z");
  if (isNaN(parsed.getTime())) return null;

  const formatted = parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <p data-testid="date-banner" className="text-sm text-muted-foreground">
      Creating workout for {formatted}
    </p>
  );
}
