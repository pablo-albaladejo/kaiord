/**
 * Pure change-token builder for cloud auto-push.
 *
 * Each synced table contributes a cheap signal: its row `count` plus the
 * `latest` value of an indexed timestamp column. The token changes whenever
 * any table gains/loses a row (count) or any row is touched in place (an edit
 * sets `updatedAt` to now, advancing the per-table max). ISO-8601 timestamps
 * sort chronologically as plain strings, so a lexical max is a chronological
 * max. Reading the max via an index keeps this O(tables), not O(all rows).
 */

export type TableSignal = {
  count: number;
  latest: string;
};

export function buildChangeToken(signals: ReadonlyArray<TableSignal>): string {
  return signals.map((signal) => `${signal.count}:${signal.latest}`).join("|");
}
