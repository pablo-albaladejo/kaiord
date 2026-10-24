import type { EstimatedZone } from "./estimate-zone-profile-types";

const ZONE = String.raw`(?:zona|zone|z)\s*([1-5])\b`;
const EXPLICIT = new RegExp(String.raw`\b${ZONE}`, "g");
const CAPPED = new RegExp(
  String.raw`\b(?:sin pasar de|without exceeding|no more than|max(?:imo)?(?: de)?)\s*(?:la\s+)?${ZONE}`,
  "g"
);
const PROGRESSION =
  /\b(?:progres\w*|hasta|until|de\s+(?:zona|zone|z)\s*[1-5]\s+a|from\s+(?:zona|zone|z)\s*[1-5]\s+to)\b/;
const RPE = /\brpe\s*:?\s*(\d+)/;
const RPE_PER_ZONE = 2;
const MIXED = /\b(?:progresiv[oa]s?|contrastes?|fartlek)\b|%|\bftp\b/;
const SECTION =
  /\b(?:parte principal|principal|main set|main|bloque|block|series|set|intervals|intervalos|calentamiento|warm[- ]?up|cool[- ]?down|vuelta a la calma|enfriamiento)\b/;
const ZONES: Array<EstimatedZone> = [1, 2, 3, 4, 5];

const WORDS: Array<[EstimatedZone, RegExp]> = [
  [
    1,
    /\b(?:rest|recovery|jog(?:ging)?|easy|cool[- ]?down|warm[- ]?up|descansos?|recuperacion|trote|suaves?|comod[oa]s?|calentamiento|vuelta a la calma)\b/,
  ],
  [2, /\b(?:endurance|aerobic[oa]?s?|steady|resistencia|continu[oa]s?)\b/],
  [
    3,
    /\b(?:tempo|moderate|sweet ?spot|marathon pace|moderad[oa]s?|ritmo maraton)\b/,
  ],
  [4, /\b(?:threshold|hard|umbral|fuertes?)\b/],
  [5, /\b(?:sprints?|vo2 ?max|max|all[- ]out|maxim[oa]s?)\b/],
];

const toZone = (n: number): EstimatedZone | null =>
  ZONES.find((zone) => zone === n) ?? null;

const lowest = (zones: Array<EstimatedZone>): EstimatedZone | null =>
  zones.length > 0 ? toZone(Math.min(...zones)) : null;

const namedZones = (text: string): Array<EstimatedZone> =>
  [...text.replace(CAPPED, " ").matchAll(EXPLICIT)].flatMap((m) => {
    const zone = toZone(Number(m[1]));
    return zone === null ? [] : [zone];
  });

const rpeZone = (text: string): EstimatedZone | null => {
  const m = RPE.exec(text);
  return m ? toZone(Math.ceil(Number(m[1]) / RPE_PER_ZONE)) : null;
};

export const explicitZone = (text: string): EstimatedZone | null =>
  lowest(namedZones(text));

// A range ("Z2-Z3", "RPE 2-3") or conflicting words resolve to the lowest
// zone; a progression between two zones, a mixed-intensity word or % FTP
// leaves the span unzoned.
export const resolveZone = (text: string): EstimatedZone | null => {
  const named = namedZones(text);
  // A ceiling ("máximo Z3") starts with a Z5 word, so the RPE, mixed and word
  // checks read the text with every ceiling removed.
  const uncapped = text.replace(CAPPED, " ");
  if (named.length > 0) {
    const progression = new Set(named).size > 1 && PROGRESSION.test(text);
    return progression ? null : lowest(named);
  }
  const rpe = rpeZone(uncapped);
  if (rpe !== null || MIXED.test(uncapped)) return rpe;
  return lowest(WORDS.filter(([, re]) => re.test(uncapped)).map(([z]) => z));
};

// Only a section word makes a label; an intensity word ("Rodaje suave")
// still titles a summary.
export const isSectionLabel = (title: string): boolean => SECTION.test(title);
