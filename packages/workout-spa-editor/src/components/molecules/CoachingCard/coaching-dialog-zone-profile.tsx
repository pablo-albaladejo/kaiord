/**
 * The coaching dialog's intensity thumbnail: the same zone-profile bar the
 * calendar card draws, at dialog size, with a minute axis and a zone legend.
 *
 * It reads only the linked workout's structured KRD. A raw workout, or no
 * linked workout at all, has no structure and nothing is rendered — there is
 * no parser estimate of a coach's free text to fall back to, and drawing one
 * from the activity's effort rating would invent a fact.
 */
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { useSessionZones } from "../WorkoutCard/use-session-zones";
import { ZoneProfileBar } from "../ZoneProfileBar/ZoneProfileBar";
import { axisTicks, profileTotalSeconds } from "./zone-profile-axis";
import { profileAriaLabel, segmentTitle } from "./zone-profile-copy";
import { ZoneProfileAxis, ZoneProfileLegend } from "./zone-profile-parts";

export const DIALOG_ZONE_PROFILE_HEIGHT = 88;

export function CoachingDialogZoneProfile({
  workout,
}: {
  workout: WorkoutRecord;
}) {
  const t = useTranslate("coaching");
  const { segments } = useSessionZones(workout);
  if (segments.length === 0) return null;
  return (
    <div data-testid="coaching-dialog-zone-profile" className="space-y-1">
      <ZoneProfileBar
        segments={segments}
        height={DIALOG_ZONE_PROFILE_HEIGHT}
        label={profileAriaLabel(t, segments)}
        segmentTitle={(segment) => segmentTitle(t, segment)}
        className="w-full"
      />
      <ZoneProfileAxis ticks={axisTicks(profileTotalSeconds(segments))} />
      <ZoneProfileLegend />
    </div>
  );
}
