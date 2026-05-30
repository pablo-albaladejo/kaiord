import type { WorkoutRecord } from "../../../types/calendar-record";
import type { Profile } from "../../../types/profile";
import { SectionHead } from "../../molecules/SectionHead";
import { PlannedEmpty } from "./PlannedEmpty";
import { PlannedSessionCard } from "./PlannedSessionCard";
import { reviewFor } from "./today-load";

export type PlannedSessionProps = {
  workout: WorkoutRecord | undefined;
  profile: Profile | null;
};

export function PlannedSession({ workout, profile }: PlannedSessionProps) {
  const review = workout ? reviewFor(workout, profile) : null;

  return (
    <section data-testid="today-planned-session">
      <SectionHead title="Planned session" />
      {workout && review ? (
        <PlannedSessionCard workout={workout} review={review} />
      ) : (
        <PlannedEmpty />
      )}
    </section>
  );
}
