import { pluralKey } from "../../../i18n/plural-key";
import type { Translate } from "../../../i18n/use-translate";
import { formatHms } from "../../../lib/workout-review/format-duration";
import {
  type ProfileSegment,
  zoneSeconds,
  type ZoneSegment,
} from "../../../lib/workout-review/zone-profile";
import { profileTotalSeconds } from "./zone-profile-axis";

/** "Z4 · 20m", or "No zone given · 30m" — the hover title of one bar. */
export const segmentTitle = (t: Translate, segment: ProfileSegment): string => {
  const duration = formatHms(segment.seconds);
  return segment.zone === null
    ? t("profile.noZoneBarTitle", { duration })
    : t("profile.barTitle", { zone: segment.zone, duration });
};

const isZoned = (segment: ProfileSegment): segment is ZoneSegment =>
  segment.zone !== null;

/**
 * The chart's accessible summary: total length, how many blocks, and the time
 * spent in each zone the session touches, in Z1→Z5 order, then the time the
 * text gives no zone for. An estimate says it is one.
 */
export function profileAriaLabel(
  t: Translate,
  segments: readonly ProfileSegment[],
  estimated = false
): string {
  const zoned = zoneSeconds(segments.filter(isZoned))
    .map((seconds, index) => ({ zone: index + 1, seconds }))
    .filter(({ seconds }) => seconds > 0)
    .map(({ zone, seconds }) =>
      t("profile.zoneTime", { zone, duration: formatHms(seconds) })
    );
  const unzonedSeconds = segments
    .filter((segment) => !isZoned(segment))
    .reduce((sum, segment) => sum + segment.seconds, 0);
  const unzoned =
    unzonedSeconds > 0
      ? [t("profile.noZoneTime", { duration: formatHms(unzonedSeconds) })]
      : [];
  const breakdown = [...zoned, ...unzoned].join(", ");
  const key = estimated ? "profile.estimateAriaLabel" : "profile.ariaLabel";
  return t(pluralKey(key, segments.length), {
    count: segments.length,
    duration: formatHms(profileTotalSeconds(segments)),
    breakdown,
  });
}
