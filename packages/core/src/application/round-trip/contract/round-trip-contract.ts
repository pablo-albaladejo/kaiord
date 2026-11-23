import type { DurationType } from "../../../domain/schemas/duration-type";
import type { Intensity } from "../../../domain/schemas/intensity";
import type { Sport } from "../../../domain/schemas/sport";
import type { TargetType } from "../../../domain/schemas/target-type";

/**
 * A KRD field, as a dotted path from the KRD root. Array items are numbered
 * segments; `*` stands for one segment and `**` for any number of them.
 */
export type FieldPattern = string;

/**
 * A tolerance on the numbers of a field. A target's value, min and max are
 * read by the target's type and unit (a zone is exact, a pace is not a watt),
 * so a rule on `target.value.*` names the `targetType` and `units` it covers.
 */
export type FieldTolerance = {
  field: FieldPattern;
  tolerance: number;
  reason: string;
  targetType?: TargetType;
  units?: ReadonlyArray<string>;
};

export type DeclaredField = { field: FieldPattern; reason: string };

export type UnsupportedTarget = {
  type: TargetType;
  unit?: string;
  basis?: string;
  reason: string;
};

/**
 * What a format keeps when a workout goes through it and back to KRD. Every
 * number is compared within the tolerance of the first matching field, or
 * exactly; every other value exactly. A field the format cannot carry, or one
 * it fills in, is listed with its reason, never skipped silently.
 */
export type RoundTripContract = {
  format: string;
  name: string;
  tolerances: ReadonlyArray<FieldTolerance>;
  /** Fields the format cannot carry: their value after the trip is not compared. */
  notCarried: ReadonlyArray<DeclaredField>;
  /** Fields the format fills in when the KRD had none (a default, an extension). */
  filledIn: ReadonlyArray<DeclaredField>;
  /** Kinds of step the format cannot hold at all. */
  unsupported: {
    durations: ReadonlyArray<{ type: DurationType; reason: string }>;
    targets: ReadonlyArray<UnsupportedTarget>;
    intensities: ReadonlyArray<{ intensity: Intensity; reason: string }>;
  };
  /** The sports the format carries; every other sport is not carried, for `reason`. */
  sports: { carried: "all" | ReadonlyArray<Sport>; reason: string };
};

export type RoundTripDifference = {
  field: string;
  kind: "missing" | "added" | "changed";
  before?: unknown;
  after?: unknown;
  tolerance?: number;
};
