/**
 * The four numbers above the source cards, derived from the same list the
 * cards are rendered from.
 *
 * `detected` counts discovered extensions, not live sessions. A session count
 * cannot reach its own denominator — `tanita-bridge` has no session prober by
 * design, so it is permanently session-inactive and the counter would sit one
 * short forever, which reads as a defect rather than as a state. This is the
 * same choice, and the same word, as the Settings index row.
 *
 * `lastSync` is `coachingSyncState`'s newest row, which is persisted and
 * survives a reload. `lastCheckedAt` is deliberately not used anywhere here:
 * it records when the SPA last probed, which is seconds ago after every
 * reload however long a source has been quiet.
 */
import type { ConnectionCoverage } from "./connection-coverage";
import type { ConnectionSource } from "./connection-source";
import { sourceNeedsAttention } from "./connection-source";

export type ConnectionLastSync = {
  readonly at: string;
  readonly sourceName: string;
};

export type ConnectionSummary = {
  readonly detected: number;
  readonly detectedTotal: number;
  readonly covered: number;
  readonly coveredTotal: number;
  readonly attention: number;
  readonly lastSync: ConnectionLastSync | undefined;
};

const newestSync = (
  sources: readonly ConnectionSource[]
): ConnectionLastSync | undefined => {
  let best: ConnectionLastSync | undefined;
  let bestAt = -Infinity;
  for (const source of sources) {
    if (source.lastSyncAt === undefined) continue;
    const at = new Date(source.lastSyncAt).getTime();
    if (Number.isNaN(at) || at <= bestAt) continue;
    bestAt = at;
    best = { at: source.lastSyncAt, sourceName: source.name };
  }
  return best;
};

export const buildConnectionSummary = (
  sources: readonly ConnectionSource[],
  coverage: ConnectionCoverage
): ConnectionSummary => {
  const bridges = sources.filter((source) => source.mechanism === "bridge");
  return {
    detected: bridges.filter((source) => source.bridgeDetected).length,
    detectedTotal: bridges.length,
    covered: coverage.covered.length,
    coveredTotal: coverage.total,
    attention: sources.filter(sourceNeedsAttention).length,
    lastSync: newestSync(sources),
  };
};
