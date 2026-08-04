/**
 * Formats the sport's primary threshold and the profile timestamp behind it,
 * ready for a screen's own sentence.
 *
 * The two parts are returned separately because each surface justifies a
 * different control and owns its own copy: the generator says what it writes
 * against, the detail sheet says what its zone shading is measured against.
 *
 * NOT what a detail sheet's targets came from. `stepDetail` takes no
 * thresholds at all — an absolute `@ 250 W` is stored in the KRD at generation
 * time and rendered verbatim forever, so it reflects whatever the threshold
 * was THEN. Only the zone classification consumes today's number. Copy that
 * says otherwise is false the moment an athlete edits their FTP.
 *
 * Both surfaces name the ATHLETE PROFILE as the origin — see
 * `buildThresholdProvenance` for why no per-field source exists to name.
 *
 * Returns null when the sport has no primary threshold set, or when the
 * profile carries no parseable timestamp: callers render nothing rather than
 * a line with a placeholder, and "never synced" is a coaching-sync concept
 * this line has no business borrowing.
 */
import { useUnits } from "../contexts/units-context";
import { useActiveLocale } from "../i18n/LocaleProvider";
import { useTranslate } from "../i18n/use-translate";
import { buildThresholdProvenance } from "../lib/athlete/threshold-provenance";
import type { Profile } from "../types/profile";
import { formatRelativeTime } from "../utils/format-relative-time";

export type ThresholdProvenanceText = {
  /** e.g. "FTP 268 W" or "Threshold pace 4:05/km". */
  threshold: string;
  /** e.g. "4d ago" — already resolved through the `common` namespace. */
  relative: string;
};

/* A pace unit is a suffix ("/km"); a power unit is a separate word ("W"). */
const joinUnit = (value: string, unit: string): string => {
  if (unit === "") return value;
  return unit.startsWith("/") ? `${value}${unit}` : `${value} ${unit}`;
};

export function useThresholdProvenance(
  profile: Profile | null | undefined,
  sport: string
): ThresholdProvenanceText | null {
  const tZones = useTranslate("zones");
  const tCommon = useTranslate("common");
  const locale = useActiveLocale();
  const units = useUnits();

  const provenance = buildThresholdProvenance(profile, sport, units);
  if (!provenance?.updatedAt) return null;

  const relative = formatRelativeTime(provenance.updatedAt, new Date(), locale);
  return {
    threshold: joinUnit(
      `${tZones(`thresholdName.${provenance.metric}`)} ${provenance.value}`,
      provenance.unit
    ),
    relative: tCommon(relative.key, relative.params),
  };
}
