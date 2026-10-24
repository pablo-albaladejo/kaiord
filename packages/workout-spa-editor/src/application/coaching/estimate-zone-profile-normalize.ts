const NUM = String.raw`\d+(?:[.,]\d+)?`;
const HOURS = String.raw`\s*h(?:oras?|ours?|rs?)?\b`;

const ENTRE_RANGE = new RegExp(
  String.raw`\bentre\s+(${NUM})\s+y\s+(${NUM})`,
  "g"
);

// "45'/50'" is a range, but "10x1'/1'" pairs work and recovery.
const ALT_RANGE = new RegExp(
  String.raw`(?<!x\s*)\b(${NUM})(?:\s*(?:'|min(?:uto|ute)?s?\b)?\s*\/\s*|\s+a\s+)(${NUM})\b`,
  "g"
);

const ALT_CHOICE = new RegExp(
  String.raw`\b(${NUM})\s*(?:'|min(?:uto|ute)?s?\b)?\s+(?:o|or)\s+(${NUM})\b`,
  "g"
);

const FRACTIONS: Array<[RegExp, string]> = [
  [
    new RegExp(
      String.raw`\b1\/2${HOURS}|\bmedia\s+hora\b|\bhalf an hour\b`,
      "g"
    ),
    "30'",
  ],
  [new RegExp(String.raw`\b3\/4${HOURS}`, "g"), "45'"],
  [new RegExp(String.raw`\b1\/4${HOURS}`, "g"), "15'"],
];

const CLOCK =
  /\b(?:a las?\s+\d{1,2}(?:[:.h]\d{2})?h?|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|at\s+\d{1,2}:\d{2})\b/g;

// A pace ("4'30\"/km", "4:30 min/km", "ritmo 5'/km") reads like a duration.
const PACE =
  /(?:\britmo\s+(?:de\s+)?)?(?<![\w.])\d+(?:['":.,]\d+)?["']?\s*(?:min(?:utos?)?)?\s*\/\s*(?:km|mi|milla|mile|100\s*m)\b/g;

const REPEAT_BLOCK =
  /\b(?:repeat|repite|repetir)\s+(\d{1,2})\s+(?:times|veces)\s*:?\s*([^.\n]+)/g;

const DISTANCE =
  /\b\d+(?:[.,]\d+)?\s*(?:km|k|m|metros?|meters?|metres?|kilometros?)\b/;
const LOOSE_REPEAT = /\b\d+\s*(?:veces|times)\b/;

// Ranges and alternatives are rewritten to "a-b" so every reader takes the
// lower bound, and "repeat 3 times: a, b" becomes "3x(a, b)".
export const normalizeCoachText = (text: string): string =>
  FRACTIONS.reduce(
    (out, [re, minutes]) => out.replace(re, minutes),
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f\ue000-\uf8ff]/g, "")
      .toLowerCase()
      .replace(/×/g, "x")
      .replace(/[’‘´`′]/g, "'")
      .replace(/''/g, '"')
      .replace(/[“”″]/g, '"')
      .replace(CLOCK, " ")
      .replace(PACE, " ")
  )
    .replace(ENTRE_RANGE, "$1-$2")
    .replace(ALT_RANGE, "$1-$2")
    .replace(ALT_CHOICE, "$1-$2")
    .replace(REPEAT_BLOCK, "$1x($2)");

// A distance has no width without a pace, and a repeat count the repeat
// grammar did not consume ("3 veces 2' z4") has nothing to repeat.
export const isUnreadable = (text: string): boolean =>
  DISTANCE.test(text) || LOOSE_REPEAT.test(text);
