/**
 * Search-text normalization for chat search.
 *
 * Matching is accent- and case-insensitive: NFD decomposition strips diacritics
 * and the result is lowercased, so "Úmbral" and "umbral" compare equal. Queries
 * tokenize on whitespace; single-character tokens are dropped (`MIN_TOKEN_LENGTH`)
 * so noise like a stray "y"/"a" does not constrain the AND match.
 *
 * `normalizeWithMap` additionally returns an index back to the ORIGINAL string so
 * highlight offsets land on the accented source text, since NFD changes lengths.
 */

export const MIN_TOKEN_LENGTH = 2;

const DIACRITICS = /\p{Diacritic}/gu;

export const normalizeSearchText = (text: string): string =>
  text.normalize("NFD").replace(DIACRITICS, "").toLowerCase();

export const tokenize = (query: string): string[] =>
  normalizeSearchText(query)
    .split(/\s+/)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

export type NormalizedText = {
  /** Accent-stripped, lowercased form used for matching. */
  normalized: string;
  /** `map[i]` is the original-string index that produced normalized char `i`. */
  map: number[];
};

/** Normalize per code point, recording each normalized char's source offset. */
export const normalizeWithMap = (text: string): NormalizedText => {
  let normalized = "";
  const map: number[] = [];
  let originalIndex = 0;
  for (const codePoint of text) {
    const piece = codePoint
      .normalize("NFD")
      .replace(DIACRITICS, "")
      .toLowerCase();
    for (const char of piece) {
      normalized += char;
      map.push(originalIndex);
    }
    originalIndex += codePoint.length;
  }
  return { normalized, map };
};

/** Count non-overlapping occurrences of `token` within already-normalized text. */
export const countOccurrences = (normalized: string, token: string): number => {
  if (token.length === 0) return 0;
  let count = 0;
  let from = 0;
  for (;;) {
    const at = normalized.indexOf(token, from);
    if (at === -1) return count;
    count += 1;
    from = at + token.length;
  }
};
