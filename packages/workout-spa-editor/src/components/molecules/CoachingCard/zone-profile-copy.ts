import { pluralKey } from "../../../i18n/plural-key";
import type { Translate } from "../../../i18n/use-translate";
import {
  formatHms,
  zoneSeconds,
  type ZoneSegment,
} from "../../../lib/workout-review";
import { profileTotalSeconds } from "./zone-profile-axis";

/** "Z4 · 20m" — the hover title of one bar. */
export const segmentTitle = (t: Translate, segment: ZoneSegment): string =>
  t("profile.barTitle", {
    zone: segment.zone,
    duration: formatHms(segment.seconds),
  });

/**
 * The chart's accessible summary: total length, how many blocks, and the time
 * spent in each zone the session touches, in Z1→Z5 order.
 */
export function profileAriaLabel(
  t: Translate,
  segments: readonly ZoneSegment[]
): string {
  const breakdown = zoneSeconds(segments)
    .map((seconds, index) => ({ zone: index + 1, seconds }))
    .filter(({ seconds }) => seconds > 0)
    .map(({ zone, seconds }) =>
      t("profile.zoneTime", { zone, duration: formatHms(seconds) })
    )
    .join(", ");
  return t(pluralKey("profile.ariaLabel", segments.length), {
    count: segments.length,
    duration: formatHms(profileTotalSeconds(segments)),
    breakdown,
  });
}
