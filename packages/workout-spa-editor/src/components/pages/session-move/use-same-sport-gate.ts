import { useCallback, useState } from "react";

import { readDayInputs } from "../../../application/read-day-inputs";
import { sameSportOnDay } from "../../../application/same-sport-on-day";
import { canonicalizeSport } from "../../../lib/canonicalize-sport";
import type { PersistencePort } from "../../../ports/persistence-port";

export type SameSportPending = {
  workoutId: string;
  day: string;
  sport: string;
  recording: boolean;
};

type Move = (workoutId: string, day: string) => void | Promise<void>;

/**
 * Runs the same-sport check before a move (design §3.8): a clear day moves
 * at once; a same-sport day waits for `confirm`, and `cancel` writes
 * nothing. A missing workout or a same-day drop goes straight to `move`,
 * which reports it. A failed read or write, on request or on confirm, goes
 * to `onError`.
 */
export function useSameSportGate(
  persistence: PersistencePort,
  move: Move,
  onError: () => void
) {
  const [pending, setPending] = useState<SameSportPending | null>(null);

  const check = useCallback(
    async (workoutId: string, day: string): Promise<void> => {
      const workout = await persistence.workouts.getById(workoutId);
      if (!workout || workout.date === day) return move(workoutId, day);
      const inputs = await readDayInputs(persistence, {
        profileId: workout.profileId,
        day,
        movedWorkoutId: workoutId,
      });
      const verdict = sameSportOnDay(inputs, workout.sport, canonicalizeSport);
      if (verdict.kind === "clear") return move(workoutId, day);
      const { sport } = workout;
      setPending({ workoutId, day, sport, recording: verdict.recording });
    },
    [persistence, move]
  );

  const request = useCallback(
    (workoutId: string, day: string) =>
      void check(workoutId, day).catch(onError),
    [check, onError]
  );

  const confirm = useCallback(() => {
    setPending(null);
    if (!pending) return;
    void Promise.resolve()
      .then(() => move(pending.workoutId, pending.day))
      .catch(onError);
  }, [pending, move, onError]);

  const cancel = useCallback(() => setPending(null), []);

  return { pending, request, confirm, cancel };
}
