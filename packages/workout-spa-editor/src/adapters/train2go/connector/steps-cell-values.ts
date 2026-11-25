/**
 * The values in a session's steps grid: durations (`N min`, `N seg`,
 * `M:SS min`), ranges (`lo-hi`), repeat counts and zone labels. Each reader
 * returns `undefined` for anything else, never a guess.
 */
const MAX_WATTS = 5000;
const MAX_BPM = 300;
const MAX_ZONE_LABEL = 32;

export type Range = { min: number; max: number };

export const readDurationSeconds = (text: string): number | undefined => {
  const min = text.match(/^(\d+) min$/);
  if (min) return positive(Number(min[1]) * 60);
  const sec = text.match(/^(\d+) seg$/);
  if (sec) return positive(Number(sec[1]));
  const minSec = text.match(/^(\d+):([0-5]\d) min$/);
  if (minSec) return positive(Number(minSec[1]) * 60 + Number(minSec[2]));
  return undefined;
};

const positive = (n: number): number | undefined => (n > 0 ? n : undefined);

const readRange = (text: string, cap: number): Range | undefined => {
  const m = text.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return undefined;
  const range = { min: Number(m[1]), max: Number(m[2]) };
  return range.min <= range.max && range.max <= cap ? range : undefined;
};

export const readWatts = (text: string) => readRange(text, MAX_WATTS);
export const readBpm = (text: string) => readRange(text, MAX_BPM);

export const readRepeat = (text: string): number | undefined =>
  /^\d+$/.test(text) ? positive(Number(text)) : undefined;

export const readZoneLabel = (text: string): string | undefined =>
  text.length > 0 && text.length <= MAX_ZONE_LABEL ? text : undefined;
