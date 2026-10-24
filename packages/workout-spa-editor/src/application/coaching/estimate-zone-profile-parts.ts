import type { DurationToken } from "./estimate-zone-profile-duration";
import { findDurations } from "./estimate-zone-profile-duration";
import { flattenSteps, mergeSegments } from "./estimate-zone-profile-flatten";
import { hide } from "./estimate-zone-profile-hide";
import {
  GROUP_TOKEN,
  GROUP_TOKEN_G,
  groupText,
} from "./estimate-zone-profile-mask";
import type {
  EstimatedZone,
  ParseGroup,
  Step,
} from "./estimate-zone-profile-types";
import { explicitZone, resolveZone } from "./estimate-zone-profile-zone";

const REPEAT_IN_PART = /^(.*?)\b(\d{1,2})\s*x\s*(?=\d|[\ue000-\uf8ff])/;

export type ParsedPart = { step: Step; opensRepeat: boolean };

const zonesOf = (steps: Array<Step>): Array<EstimatedZone | null> =>
  mergeSegments(flattenSteps(steps)).map((segment) => segment.zone);

// A zone both before and after the duration ("Z3 15' Z1 20'") may belong to
// either span, and bracketed detail in another zone contradicts its span.
const spanZone = (
  outside: string,
  token: DurationToken,
  inner: Array<Step>
): EstimatedZone | null => {
  const before = explicitZone(outside.slice(0, token.index));
  if (before !== null && explicitZone(outside.slice(token.end)) !== null)
    hide();
  const zone = resolveZone(outside);
  const detail = zonesOf(inner);
  if (zone !== null && detail.some((z) => z !== null && z !== zone)) hide();
  return zone ?? (detail.length === 1 ? (detail[0] ?? null) : null);
};

const parseTimed = (
  part: string,
  groups: Array<string>,
  parseGroup: ParseGroup
): Step | undefined => {
  const outside = part.replace(GROUP_TOKEN_G, " ");
  const tokens = findDurations(outside);
  if (tokens.length > 1) return hide();
  const group = GROUP_TOKEN.exec(part);
  const inner = group ? parseGroup(groupText(group[0], groups)).steps : [];
  const token = tokens[0];
  if (token === undefined) {
    return inner.length > 0
      ? { kind: "repeat", count: 1, body: inner, between: [] }
      : undefined;
  }
  const zone = spanZone(outside, token, inner);
  return { kind: "timed", seconds: token.seconds, zone };
};

// A zone written before a repeat ("Z4 3x5'") belongs to its work.
export const parsePart = (
  part: string,
  groups: Array<string>,
  parseGroup: ParseGroup
): ParsedPart | undefined => {
  const m = REPEAT_IN_PART.exec(part);
  if (!m) {
    const step = parseTimed(part, groups, parseGroup);
    return step && { step, opensRepeat: false };
  }
  const lead = explicitZone(m[1] ?? "") === null ? "" : (m[1] ?? "");
  const count = Number(m[2]);
  const rest = part.slice(m[0].length);
  if (count < 1) return hide();
  if (GROUP_TOKEN.exec(rest)?.index === 0) {
    const inner = parseGroup(groupText(rest.charAt(0), groups));
    if (inner.steps.length === 0 || lead) return hide();
    const step: Step = {
      kind: "repeat",
      count,
      body: inner.steps,
      between: inner.rest,
    };
    return { step, opensRepeat: false };
  }
  const work = parseTimed(`${lead} ${rest}`, groups, parseGroup) ?? hide();
  const step: Step = { kind: "repeat", count, body: [work], between: [] };
  return { step, opensRepeat: true };
};
