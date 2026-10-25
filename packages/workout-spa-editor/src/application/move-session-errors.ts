export class WorkoutNotFoundError extends Error {
  constructor(workoutId: string) {
    super(`Workout not found: ${workoutId}`);
    this.name = "WorkoutNotFoundError";
  }
}

export type SessionNotMovableReason = "executed" | "completed";

/** A done session: it has a recording, or the coach marked it completed. */
export class SessionNotMovableError extends Error {
  readonly reason: SessionNotMovableReason;
  constructor(reason: SessionNotMovableReason) {
    super(`Session not movable: ${reason}`);
    this.name = "SessionNotMovableError";
    this.reason = reason;
  }
}
