/**
 * Every Trace on this device as one JSON file the athlete keeps: the stored
 * records as they are, newest first, under a named format and version.
 */
import type { TraceRepository } from "../../ports/simple-repositories";

export const TRACES_FORMAT = "kaiord-traces";

export type TracesFile = { filename: string; mediaType: string; text: string };

export const exportTraces = async (
  traces: TraceRepository,
  now: Date = new Date()
): Promise<TracesFile> => {
  const exportedAt = now.toISOString();
  const body = {
    format: TRACES_FORMAT,
    version: 1,
    exportedAt,
    traces: await traces.list(),
  };
  return {
    filename: `kaiord-traces-${exportedAt.slice(0, 10)}.json`,
    mediaType: "application/json",
    text: `${JSON.stringify(body, null, 2)}\n`,
  };
};
