/**
 * Parses free-text coaching activity duration to seconds.
 *
 * Returns undefined on parse failure — the heuristic deliberately tolerates
 * coach idiosyncrasies (apostrophe notation, approximate marker, ranges)
 * over rejecting them. Range inputs use the lower bound: a 45-50 min plan
 * counts as 45 min for compliance scoring (the lower bound underestimates
 * compliance on the upper-bound athlete; documented v1 convention).
 *
 * ISO 8601 RANGE syntax (PT45M/PT50M etc.) is NOT supported — only bare
 * ISO 8601 durations.
 */

const HOUR = 3600;
const MIN = 60;

const tryIso8601 = (s: string): number | undefined => {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(s);
  if (!m || (!m[1] && !m[2])) return undefined;
  return Number(m[1] ?? 0) * HOUR + Number(m[2] ?? 0) * MIN;
};

const tryHoursAndMinutes = (s: string): number | undefined => {
  const m = /^(\d+)\s*h\s*(\d+)\s*(?:m(?:in(?:utes)?)?|')?$/.exec(s);
  if (!m) return undefined;
  return Number(m[1]) * HOUR + Number(m[2]) * MIN;
};

const tryHoursOnly = (s: string): number | undefined => {
  const m = /^(\d+)\s*(?:h|hours?)$/.exec(s);
  return m ? Number(m[1]) * HOUR : undefined;
};

const tryMinutesOnly = (s: string): number | undefined => {
  const m = /^(\d+)\s*(?:m|min|mins|minutes|')$/.exec(s);
  return m ? Number(m[1]) * MIN : undefined;
};

const parseSingle = (s: string): number | undefined =>
  tryIso8601(s) ??
  tryHoursAndMinutes(s) ??
  tryHoursOnly(s) ??
  tryMinutesOnly(s);

const splitRange = (s: string): [string, string] | undefined => {
  // "1h-1h30", "1h - 1h30", "45-50 min" — split on a `-` that is not at start
  const idx = s.indexOf("-", 1);
  if (idx <= 0) return undefined;
  const left = s.slice(0, idx).trim();
  const right = s.slice(idx + 1).trim();
  if (!left || !right) return undefined;

  // ISO 8601 range syntax is forbidden (PT45M/PT50M, PT45M--PT50M)
  if (/^PT/i.test(s)) return undefined;

  // For unit-less left side ("45-50 min"), inherit unit from right.
  if (!/[a-z']/i.test(left) && /[a-z']/i.test(right)) {
    const unitMatch = /([a-z]+|')$/i.exec(right);
    return unitMatch ? [left + unitMatch[0], right] : undefined;
  }
  return [left, right];
};

export function parseCoachingDuration(
  input: string | undefined
): number | undefined {
  if (input === undefined) return undefined;
  let s = input.trim().toLowerCase();
  if (!s) return undefined;
  if (s.startsWith("~")) s = s.slice(1).trim();

  // ISO 8601 range syntax is forbidden v1.
  if (/^pt[0-9hm]+\/pt/i.test(s) || /^pt[0-9hm]+--pt/i.test(s))
    return undefined;

  // ISO 8601 needs the original case (PT, H, M); reapply on a separate path.
  const upper = input.trim().replace(/^~/, "").trim();
  const iso = tryIso8601(upper);
  if (iso !== undefined) return iso;

  const range = splitRange(s);
  if (range) {
    const lower = parseSingle(range[0]);
    if (lower !== undefined) return lower;
  }

  return parseSingle(s);
}
