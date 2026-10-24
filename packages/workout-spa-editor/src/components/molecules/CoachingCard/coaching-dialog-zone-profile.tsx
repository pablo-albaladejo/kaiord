/**
 * The coaching dialog's intensity thumbnail: the same zone-profile bar the
 * calendar card draws, at dialog size, with a minute axis and a zone legend.
 *
 * The linked workout's structured KRD always wins. With no linked workout,
 * or one with no structured profile, the profile is estimated from the
 * coach's text and captioned as an estimate; the activity's effort rating is
 * never read, since drawing from it would invent a fact.
 */
import type { WorkoutRecord } from "../../../types/calendar-record";
import { useSessionZones } from "../WorkoutCard/use-session-zones";
import { CoachingDialogZoneChart } from "./coaching-dialog-zone-chart";
import { useCoachTextEstimate } from "./use-coach-text-estimate";

type ProfileProps = { description?: string };

function EstimatedZoneProfile({ description }: ProfileProps) {
  const segments = useCoachTextEstimate(description);
  if (segments.length === 0) return null;
  return <CoachingDialogZoneChart segments={segments} estimated />;
}

function LinkedZoneProfile({
  workout,
  description,
}: ProfileProps & { workout: WorkoutRecord }) {
  const { segments } = useSessionZones(workout);
  if (segments.length === 0)
    return <EstimatedZoneProfile description={description} />;
  return <CoachingDialogZoneChart segments={segments} estimated={false} />;
}

export function CoachingDialogZoneProfile({
  workout,
  description,
}: ProfileProps & { workout: WorkoutRecord | null }) {
  return workout ? (
    <LinkedZoneProfile workout={workout} description={description} />
  ) : (
    <EstimatedZoneProfile description={description} />
  );
}
