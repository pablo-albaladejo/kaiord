/**
 * Pure health-record summarizer for the chat read tool. Sorts by date and
 * caps the row count so a long history is not serialized wholesale into the
 * prompt. Each metric's KRD payload is small (one record per day), so the
 * payload is forwarded as-is for the model to interpret.
 */

const ROW_BUDGET = 90;

export type HealthDay = { date: string; krd: unknown };
export type HealthSummary = { count: number; records: HealthDay[] };

export const summarizeHealth = (
  records: ReadonlyArray<{ date: string; krd: unknown }>
): HealthSummary => {
  const byDateAsc = [...records].sort((a, b) => a.date.localeCompare(b.date));
  return {
    count: records.length,
    records: byDateAsc.slice(-ROW_BUDGET).map((r) => ({
      date: r.date,
      krd: r.krd,
    })),
  };
};
