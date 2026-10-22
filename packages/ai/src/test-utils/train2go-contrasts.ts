// The Train2Go "rodaje con contrastes" session: what a model following the
// workout-parser rules emits (zone numbers, spans for progressive and short
// strong changes), and what generation produced before those rules existed.

type Value =
  { unit: "zone"; value: number } | { unit: "zone"; min: number; max: number };

const step = (seconds: number, intensity: string, value: Value | null) => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds },
  targetType: value ? "pace" : "open",
  target: value ? { type: "pace", value } : { type: "open" },
  intensity,
});

const z = (value: number): Value => ({ unit: "zone", value });
const span = (min: number, max: number): Value => ({ unit: "zone", min, max });

export const TRAIN2GO_CONTRASTS_MODEL_OUTPUT = {
  sport: "running",
  steps: [
    step(720, "warmup", z(1)),
    step(300, "active", z(2)),
    {
      repeatCount: 4,
      steps: [step(30, "interval", span(2, 5)), step(60, "recovery", z(1))],
    },
    step(120, "recovery", z(1)),
    {
      repeatCount: 8,
      steps: [
        step(30, "interval", span(4, 5)),
        step(60, "recovery", z(1)),
        step(20, "interval", span(4, 5)),
        step(100, "recovery", z(1)),
      ],
    },
    step(300, "cooldown", z(1)),
  ],
};

export const TRAIN2GO_CONTRASTS_PRE_FIX_OUTPUT = {
  sport: "running",
  steps: [
    step(720, "warmup", z(1)),
    step(300, "active", z(2)),
    {
      repeatCount: 4,
      steps: [step(30, "interval", null), step(60, "recovery", z(1))],
    },
    step(120, "recovery", null),
    {
      repeatCount: 8,
      steps: [
        step(30, "interval", null),
        step(60, "recovery", z(1)),
        step(20, "interval", null),
        step(100, "recovery", z(1)),
      ],
    },
    step(300, "cooldown", null),
  ],
};
