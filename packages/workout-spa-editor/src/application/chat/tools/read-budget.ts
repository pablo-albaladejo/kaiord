/**
 * Row and byte budget for a read tool's result.
 *
 * Rows arrive sorted oldest-first; the newest rows are kept. The row cap is
 * applied first, then rows are dropped from the oldest end until the whole
 * serialized result fits `maxBytes` (UTF-8). The result always says whether
 * it was cut and by how many rows, so the model can disclose it or narrow
 * the range instead of treating a partial list as complete.
 */
export const DEFAULT_MAX_BYTES = 8 * 1024;

export type Budget = { maxRows: number; maxBytes: number };

export type Truncation = { truncated: boolean; omitted: number };

const encoder = new TextEncoder();
const bytesOf = (value: unknown): number =>
  encoder.encode(JSON.stringify(value)).length;

export const applyReadBudget = <Row>(
  envelope: Record<string, unknown>,
  rowsKey: string,
  rows: readonly Row[],
  budget: Budget
): Record<string, unknown> & Truncation => {
  const recent = rows.slice(-budget.maxRows);
  // Reserve the envelope plus the widest truncation marker it can carry.
  let used = bytesOf({
    ...envelope,
    [rowsKey]: [],
    truncated: true,
    omitted: rows.length,
  });
  const keptNewestFirst: Row[] = [];
  for (let i = recent.length - 1; i >= 0; i--) {
    // +1 for the separating comma; conservative for the first row.
    const size = bytesOf(recent[i]) + 1;
    if (used + size > budget.maxBytes) break;
    used += size;
    keptNewestFirst.push(recent[i] as Row);
  }
  const omitted = rows.length - keptNewestFirst.length;
  return {
    ...envelope,
    [rowsKey]: keptNewestFirst.reverse(),
    truncated: omitted > 0,
    omitted,
  };
};
