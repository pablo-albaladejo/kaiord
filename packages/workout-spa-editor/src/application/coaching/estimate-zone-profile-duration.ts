const HOUR = 3600;
const MIN = 60;

type DurationPattern = {
  re: RegExp;
  toSeconds: (m: RegExpMatchArray) => number;
};

export type DurationToken = { index: number; end: number; seconds: number };

// A number may follow "x" ("3x5'") but never a letter or digit ("z1").
const LEAD = String.raw`(?<![a-wyz\d_])`;
const RANGE = String.raw`${LEAD}(\d+(?:[.,]\d+)?)(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*`;
const MIN_UNIT = String.raw`(?:'|min(?:uto|ute)?s?\b)`;

const num = (value: string | undefined): number =>
  Number((value ?? "").replace(",", "."));

const PATTERNS: Array<DurationPattern> = [
  {
    re: new RegExp(
      String.raw`${LEAD}(\d+)\s*(?:h|hrs?)(?:(\d{1,2})(?![\d.,]|\s*x)|\s+(\d{1,2})\s*${MIN_UNIT})`,
      "g"
    ),
    toSeconds: (m) => num(m[1]) * HOUR + num(m[2] ?? m[3]) * MIN,
  },
  {
    re: new RegExp(String.raw`${LEAD}(\d+):(\d{2})\s*(?:h|hrs?|horas?)\b`, "g"),
    toSeconds: (m) => num(m[1]) * HOUR + num(m[2]) * MIN,
  },
  {
    re: new RegExp(String.raw`${LEAD}(\d+)'(\d{1,2})(?!\d)"?`, "g"),
    toSeconds: (m) => num(m[1]) * MIN + num(m[2]),
  },
  {
    re: new RegExp(String.raw`${RANGE}(?:h|hrs?|horas?|hours?)\b`, "g"),
    toSeconds: (m) => num(m[1]) * HOUR,
  },
  {
    re: new RegExp(`${RANGE}${MIN_UNIT}`, "g"),
    toSeconds: (m) => num(m[1]) * MIN,
  },
  {
    re: new RegExp(
      String.raw`${RANGE}(?:"|seg(?:undo)?s?\b|sg\b|secs?\b|seconds?\b|s\b)`,
      "g"
    ),
    toSeconds: (m) => num(m[1]),
  },
];

const FREQUENCY = /\b(?:every|cada|a los|en el minuto|al minuto)\s*$/;

const allMatches = (text: string): Array<DurationToken> =>
  PATTERNS.flatMap(({ re, toSeconds }) =>
    [...text.matchAll(re)].map((m) => ({
      index: m.index,
      end: m.index + m[0].length,
      seconds: Math.round(toSeconds(m)),
    }))
  );

// Non-overlapping tokens, longest first at one position ("1h30" over "1h");
// a duration after "every"/"cada"/"a los" is a time point or a
// frequency, not a span.
export const findDurations = (text: string): Array<DurationToken> => {
  const tokens: Array<DurationToken> = [];
  const sorted = allMatches(text).sort(
    (a, b) => a.index - b.index || b.end - a.end
  );
  for (const token of sorted) {
    const last = tokens.at(-1);
    if (!last || token.index >= last.end) tokens.push(token);
  }
  return tokens.filter(({ index }) => !FREQUENCY.test(text.slice(0, index)));
};

export const parseStepDuration = (text: string): number | undefined =>
  findDurations(text)[0]?.seconds;
