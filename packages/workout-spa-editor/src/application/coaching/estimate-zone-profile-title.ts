import { findDurations } from "./estimate-zone-profile-duration";
import { SET_REST } from "./estimate-zone-profile-grammar";
import {
  GROUP_TOKEN_G,
  groupText,
  maskGroups,
} from "./estimate-zone-profile-mask";
import { TITLE_COLON, TOTAL } from "./estimate-zone-profile-total";

const hasDuration = (text: string): boolean => findDurations(text).length > 0;

// Durations inside brackets ("Series: 4x(3' z4 + 2' z1)") count, so the
// groups are restored before looking for one.
export const titleOf = (line: string): string | undefined => {
  const { masked, groups } = maskGroups(line);
  const [title = "", ...after] = masked.split(TITLE_COLON);
  const post = after
    .join(" ")
    .replace(GROUP_TOKEN_G, (token) => ` (${groupText(token, groups)}) `);
  const isTitle = after.length > 0 && !SET_REST.test(line) && !TOTAL.test(line);
  return isTitle && !hasDuration(title) && hasDuration(post)
    ? title
    : undefined;
};

export const stepText = (line: string): string =>
  (titleOf(line) === undefined ? line : line.replace(/^[^:]*:/, ""))
    .replace(/\s+/g, " ")
    .trim();
