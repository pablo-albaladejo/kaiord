import { useTranslate } from "../../../i18n/use-translate";
import type { ProfileSegment } from "../../../lib/workout-review/zone-profile";
import { ZoneProfileBar } from "../ZoneProfileBar/ZoneProfileBar";
import { axisTicks, profileTotalSeconds } from "./zone-profile-axis";
import { profileAriaLabel, segmentTitle } from "./zone-profile-copy";
import { ZoneProfileAxis, ZoneProfileLegend } from "./zone-profile-parts";

export const DIALOG_ZONE_PROFILE_HEIGHT = 88;

/** The dialog-size profile: bars, minute axis, zone legend, and, for an
    estimate, a caption saying it was read from the coach's text. */
export function CoachingDialogZoneChart({
  segments,
  estimated,
}: {
  segments: readonly ProfileSegment[];
  estimated: boolean;
}) {
  const t = useTranslate("coaching");
  return (
    <div data-testid="coaching-dialog-zone-profile" className="space-y-1">
      <ZoneProfileBar
        segments={segments}
        height={DIALOG_ZONE_PROFILE_HEIGHT}
        label={profileAriaLabel(t, segments, estimated)}
        segmentTitle={(segment) => segmentTitle(t, segment)}
        className="w-full"
      />
      <ZoneProfileAxis ticks={axisTicks(profileTotalSeconds(segments))} />
      <ZoneProfileLegend />
      {estimated ? (
        <p
          data-testid="coaching-dialog-zone-estimate-caption"
          className="text-[10px] italic text-muted-foreground"
        >
          {t("profile.estimateCaption")}
        </p>
      ) : null}
    </div>
  );
}
