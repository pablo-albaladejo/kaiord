/**
 * How long the Traces are kept: the newest `TRACE_LIMIT`, and none started
 * more than `TRACE_MAX_AGE_DAYS` ago. Applied after every write, so the store
 * never holds more than the limit plus the one just written.
 */
import type { TraceRepository } from "../../ports/simple-repositories";

const TRACE_LIMIT = 200;
const TRACE_MAX_AGE_DAYS = 90;

const DAY_MS = 86_400_000;

export const pruneTraces = async (
  traces: TraceRepository,
  now: Date
): Promise<void> => {
  const cutoff = new Date(now.getTime() - TRACE_MAX_AGE_DAYS * DAY_MS);
  const all = await traces.list();
  const stale = all.filter(
    (trace, index) => index >= TRACE_LIMIT || new Date(trace.startedAt) < cutoff
  );
  if (stale.length > 0) await traces.deleteMany(stale.map((t) => t.id));
};
