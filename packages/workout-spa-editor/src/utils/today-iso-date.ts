/** Today's calendar date as `YYYY-MM-DD` (UTC, repo-wide convention). */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
