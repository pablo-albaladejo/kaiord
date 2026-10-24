import { findDurations } from "./estimate-zone-profile-duration";
import { hide } from "./estimate-zone-profile-hide";

export const TOTAL = /\b(?:en\s+)?total\b/;
export const TITLE_COLON = /(?<!\d):|:(?!\d)/;

// "total 15'" / "60' en total" anywhere states a total and is no step;
// "Total 1h: 15' z1, …" states it and keeps the steps after the colon.
export const takeTotal = (chunk: string, expected: Array<number>): string => {
  if (!TOTAL.test(chunk)) return chunk;
  const [head = "", ...tail] = chunk.split(TITLE_COLON);
  const titled =
    tail.length > 0 && TOTAL.test(head) && findDurations(head).length > 0;
  const stated = findDurations(titled ? head : chunk);
  if (stated.length !== 1) hide();
  expected.push(stated[0]?.seconds ?? hide());
  return titled ? tail.join(":") : "";
};
