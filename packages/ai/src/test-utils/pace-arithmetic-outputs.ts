// What a model following the workout-parser rules (prompt 1.4.0) returns for
// each pace-arithmetic benchmark: the coach's numbers copied in the coach's
// units, nothing computed. Hand-written test doubles, NOT recorded cassettes:
// they prove the code computes the right numbers from the right literals; a
// live run is what shows a real model returns these literals.

type Value = Record<string, unknown>;
type Duration = Record<string, unknown> & { type: string };

const step = (
  duration: Duration,
  intensity: string,
  value?: Value,
  type = "pace"
) => ({
  stepIndex: 0,
  durationType: duration.type,
  duration,
  targetType: value ? type : "open",
  target: value ? { type, value } : { type: "open" },
  intensity,
});

const min = (minutes: number, seconds?: number): Duration => ({
  type: "time",
  minutes,
  ...(seconds === undefined ? {} : { seconds }),
});
const sec = (seconds: number): Duration => ({ type: "time", seconds });
const m = (meters: number): Duration => ({ type: "distance", meters });
const km = (kilometers: number): Duration => ({ type: "distance", kilometers });
const z = (value: number): Value => ({ unit: "zone", value });
const perKm = (clock: string, clockTo?: string): Value => ({
  unit: "pace",
  per: "km",
  clock,
  ...(clockTo ? { clockTo } : {}),
});
const ref = (reference: string): Value => ({ unit: "reference", reference });
const block = (repeatCount: number, ...steps: Array<unknown>) => ({
  repeatCount,
  steps,
});
const workout = (sport: string, ...steps: Array<unknown>) => ({
  sport,
  steps,
});

export const PACE_ARITHMETIC_MODEL_OUTPUTS: Record<string, unknown> = {
  "pace-en-explicit": workout(
    "running",
    step(min(10), "warmup", z(1)),
    step(min(20), "active", perKm("4:30")),
    block(
      5,
      step(m(800), "interval", { unit: "split", clock: "3:10" }),
      step(min(2), "rest", z(1))
    ),
    step(min(10), "cooldown", z(1))
  ),
  "pace-en-10k-reps": workout(
    "running",
    step(min(15), "warmup", z(1)),
    block(
      4,
      step(km(1), "interval", ref("10k")),
      step(sec(90), "recovery", z(1))
    ),
    step(min(10), "cooldown", z(1))
  ),
  "pace-en-mile": workout(
    "running",
    block(
      3,
      step({ type: "distance", miles: 1 }, "interval", {
        unit: "pace",
        per: "mi",
        clock: "7:00",
      }),
      step(min(3), "recovery", z(1))
    )
  ),
  "pace-en-speed-hr": workout(
    "running",
    step(min(40), "active", { unit: "kmh", value: 12 }),
    step(
      min(10),
      "active",
      { unit: "percent_max", min: 75, max: 80 },
      "heart_rate"
    )
  ),
  "pace-en-swim": workout(
    "swimming",
    block(
      10,
      step(m(100), "interval", { unit: "pace", per: "100m", clock: "1:45" }),
      step(sec(20), "rest")
    )
  ),
  "pace-es-explicit": workout(
    "running",
    step(km(2), "warmup", perKm("5:30")),
    block(
      3,
      step(km(2), "interval", perKm("4:45", "4:50")),
      step(min(3), "recovery", z(1))
    ),
    step(km(1.5), "cooldown", { unit: "kmh", value: 12 })
  ),
  "pace-es-reference": workout(
    "running",
    step(min(20), "warmup", z(1)),
    block(
      6,
      step(m(1000), "interval", ref("10k")),
      step(min(1, 30), "recovery", z(1))
    ),
    step(min(10), "cooldown", z(1))
  ),
  "pace-es-fill": workout(
    "running",
    step(min(15), "warmup", z(1)),
    {
      fill: min(30),
      steps: [
        step(min(1), "interval", perKm("3:50")),
        step(min(2), "recovery", z(1)),
      ],
    },
    step(min(10), "cooldown", z(1))
  ),
  "pace-es-total": workout(
    "running",
    step({ type: "time", hours: 1, minutes: 15 }, "active", perKm("5:10"))
  ),
  "pace-es-umbral": workout(
    "running",
    step(min(15), "warmup", z(1)),
    block(
      3,
      step(min(8), "interval", ref("threshold")),
      step(min(2), "recovery", z(1))
    ),
    step(min(10), "cooldown", z(1))
  ),
};
