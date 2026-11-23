import type { RoundTripContract } from "../application/round-trip/contract/round-trip-contract";
import type { Duration } from "../domain/schemas/duration";
import type { Intensity } from "../domain/schemas/intensity";
import { intensitySchema } from "../domain/schemas/intensity";
import type { KRD } from "../domain/schemas/krd";
import { sportSchema } from "../domain/schemas/sport";
import type { Target } from "../domain/schemas/target";
import type { WorkoutStep } from "../domain/schemas/workout";
import {
  buildStructureWorkout,
  buildSwimWorkout,
  roundTripStep,
  roundTripWorkout,
} from "./round-trip-structure";
import {
  ROUND_TRIP_DURATIONS,
  ROUND_TRIP_TARGETS,
  sportForTarget,
  targetKey,
} from "./round-trip-samples";

export type RoundTripCase = { name: string; krd: KRD };

const OPEN: Target = { type: "open" };
const ONE_MINUTE: Duration = { type: "time", seconds: 60 };

const oneStep = (sport: string, step: WorkoutStep): KRD =>
  roundTripWorkout(sport, [step]);

const durationCase = (d: Duration): RoundTripCase => ({
  name: `duration ${d.type}`,
  krd: oneStep("cycling", roundTripStep(d, OPEN)),
});

const targetCase = (t: Target): RoundTripCase => ({
  name: `target ${targetKey(t)}`,
  krd: oneStep(sportForTarget(t), roundTripStep(ONE_MINUTE, t)),
});

const intensityCase = (intensity: Intensity): RoundTripCase => ({
  name: `intensity ${intensity}`,
  krd: oneStep("cycling", roundTripStep(ONE_MINUTE, OPEN, { intensity })),
});

const sportCase = (sport: string): RoundTripCase => ({
  name: `sport ${sport}`,
  krd: oneStep(sport, roundTripStep(ONE_MINUTE, OPEN)),
});

const isCarriedSport = (contract: RoundTripContract, sport: string) =>
  contract.sports.carried === "all" ||
  (contract.sports.carried as ReadonlyArray<string>).includes(sport);

const unsupportedTarget = (contract: RoundTripContract, t: Target) =>
  contract.unsupported.targets.some(
    (u) => targetKey(t) === [u.type, u.unit, u.basis].filter(Boolean).join("/")
  );

const split = (contract: RoundTripContract) => {
  const { durations, intensities } = contract.unsupported;
  const noDuration = (d: Duration) => durations.some((u) => u.type === d.type);
  const noIntensity = (i: Intensity) =>
    intensities.some((u) => u.intensity === i);
  const noTarget = (t: Target) =>
    unsupportedTarget(contract, t) ||
    !isCarriedSport(contract, sportForTarget(t));
  const sports = sportSchema.options;
  return {
    carried: [
      ...ROUND_TRIP_DURATIONS.filter((d) => !noDuration(d)).map(durationCase),
      ...ROUND_TRIP_TARGETS.filter((t) => !noTarget(t)).map(targetCase),
      ...intensitySchema.options
        .filter((i) => !noIntensity(i))
        .map(intensityCase),
      ...sports.filter((s) => isCarriedSport(contract, s)).map(sportCase),
    ],
    unsupported: [
      ...ROUND_TRIP_DURATIONS.filter(noDuration).map(durationCase),
      ...ROUND_TRIP_TARGETS.filter((t) => unsupportedTarget(contract, t)).map(
        targetCase
      ),
      ...intensitySchema.options.filter(noIntensity).map(intensityCase),
      ...sports.filter((s) => !isCarriedSport(contract, s)).map(sportCase),
    ],
  };
};

/**
 * Workouts covering every duration type, target type and unit, intensity and
 * sport the contract does not declare unsupported, plus a structured workout
 * (repeats, names, notes) and, where swimming is carried, a pool swim.
 */
export const buildRoundTripCases = (
  contract: RoundTripContract
): Array<RoundTripCase> => {
  const structure = { name: "structure", krd: buildStructureWorkout() };
  const swim = isCarriedSport(contract, "swimming")
    ? [{ name: "pool swim", krd: buildSwimWorkout() }]
    : [];
  return [...split(contract).carried, structure, ...swim];
};

/** One workout per kind the contract declares unsupported: none may survive. */
export const buildUnsupportedCases = (
  contract: RoundTripContract
): Array<RoundTripCase> => split(contract).unsupported;
