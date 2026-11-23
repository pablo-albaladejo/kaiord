import { useCoachingSportLabel } from "../../../hooks/use-coaching-sport-label";
import type { CoachingSport } from "../../../types/coaching-activity";

/** The sport's icon, named for assistive technology in the athlete's words. */
export const CoachingSportIcon = ({ sport }: { sport: CoachingSport }) => (
  <span role="img" aria-label={useCoachingSportLabel(sport)}>
    {sport.icon}
  </span>
);
