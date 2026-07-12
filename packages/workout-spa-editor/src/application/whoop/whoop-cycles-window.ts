/**
 * Window helpers for the WHOOP cycles sync. The internal `cycles/details` BFF
 * caps a window near 200 days, so a longer request is split into bounded
 * sub-windows and each read path is built from the numeric user `id` and the
 * ISO `startTime`/`endTime` the endpoint expects.
 */
const CYCLES_PATH = "/core-details-bff/v0/cycles/details";
const MAX_WINDOW_DAYS = 200;
const MS_PER_DAY = 86_400_000;

export type CyclesWindow = { startTime: string; endTime: string };

export const chunkWindow = (
  startTime: string,
  endTime: string,
  maxDays: number = MAX_WINDOW_DAYS
): CyclesWindow[] => {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    return [{ startTime, endTime }];
  }
  const span = maxDays * MS_PER_DAY;
  const windows: CyclesWindow[] = [];
  for (let cursor = start; cursor < end; cursor += span) {
    const chunkEnd = Math.min(cursor + span, end);
    windows.push({
      startTime: new Date(cursor).toISOString(),
      endTime: new Date(chunkEnd).toISOString(),
    });
  }
  return windows;
};

export const buildCyclesPath = (userId: number, window: CyclesWindow): string =>
  `${CYCLES_PATH}?id=${userId}` +
  `&startTime=${encodeURIComponent(window.startTime)}` +
  `&endTime=${encodeURIComponent(window.endTime)}`;
