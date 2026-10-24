import { findDurations } from "./estimate-zone-profile-duration";

const REPEAT_TOKEN = /\b\d{1,2}\s*x\s*(?=\d|[\ue000-\uf8ff])/g;

// A step starts at every duration and every "Nx"; text before the first
// token (e.g. "warmup 15min", "Z4 3x5'") belongs to it.
export const splitAtTokens = (text: string): Array<string> => {
  const repeats = [...text.matchAll(REPEAT_TOKEN)];
  const repeatEnds = new Set(repeats.map((m) => m.index + m[0].length));
  const durations = findDurations(text)
    .map(({ index }) => index)
    .filter((index) => !repeatEnds.has(index));
  const starts = [...repeats.map((m) => m.index), ...durations].sort(
    (a, b) => a - b
  );
  if (starts.length === 0) return [text];
  return [0, ...starts.slice(1)]
    .map((cut, i, all) => text.slice(cut, all[i + 1]))
    .filter((part) => part.trim() !== "");
};
