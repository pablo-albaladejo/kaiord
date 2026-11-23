// Builders for the raw output a model returns, before any resolution, so a
// test can state exactly what the model named and check what code computed.

export type Raw = Record<string, unknown>;

export const rawStep = (duration: Raw, value?: Raw, extra: Raw = {}): Raw => ({
  stepIndex: 0,
  durationType: duration.type,
  duration,
  targetType: value ? "pace" : "open",
  target: value ? { type: "pace", value } : { type: "open" },
  intensity: "active",
  ...extra,
});

export const rawWorkout = (sport: string, ...steps: Array<Raw>): Raw => ({
  sport,
  steps,
});

export const stepsOf = (raw: unknown): Array<Raw> =>
  (raw as { steps: Array<Raw> }).steps;

export const durationOf = (raw: unknown, i = 0) => stepsOf(raw)[i]!.duration;

export const valueOf = (raw: unknown, i = 0) =>
  (stepsOf(raw)[i]!.target as { value?: unknown }).value;
