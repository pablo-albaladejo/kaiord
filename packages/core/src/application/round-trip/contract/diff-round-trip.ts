import { matchesField } from "./field-pattern";
import { toleranceOf } from "./field-tolerance";
import { leavesOf } from "./krd-leaves";
import type {
  DeclaredField,
  RoundTripContract,
  RoundTripDifference,
} from "./round-trip-contract";

const declaredBy = (
  field: string,
  list: ReadonlyArray<DeclaredField>
): DeclaredField | undefined => list.find((d) => matchesField(field, d.field));

const changed = (
  field: string,
  [before, after]: [unknown, unknown],
  root: unknown,
  contract: RoundTripContract
): RoundTripDifference | null => {
  if (typeof before === "number" && typeof after === "number") {
    const tolerance = toleranceOf(field, root, contract);
    return Math.abs(before - after) <= tolerance
      ? null
      : { field, kind: "changed", before, after, tolerance };
  }
  return before === after ? null : { field, kind: "changed", before, after };
};

/**
 * Compares a KRD before and after a trip through a format, field by field.
 * `differences` are the values the trip lost, added or moved outside their
 * tolerance; `declared` are the fields the contract excused, by pattern.
 */
export const diffRoundTrip = (
  before: unknown,
  after: unknown,
  contract: RoundTripContract
): { differences: Array<RoundTripDifference>; declared: Array<string> } => {
  const a = leavesOf(before);
  const b = leavesOf(after);
  const differences: Array<RoundTripDifference> = [];
  const declared = new Set<string>();
  const excuse = (field: string, list: ReadonlyArray<DeclaredField>) => {
    const rule = declaredBy(field, list);
    if (rule) declared.add(rule.field);
    return rule !== undefined;
  };
  for (const [field, value] of a) {
    if (excuse(field, contract.notCarried)) continue;
    if (!b.has(field)) {
      differences.push({ field, kind: "missing", before: value });
      continue;
    }
    const pair: [unknown, unknown] = [value, b.get(field)];
    const difference = changed(field, pair, before, contract);
    if (difference) differences.push(difference);
  }
  for (const [field, value] of b) {
    if (a.has(field) || excuse(field, contract.filledIn)) continue;
    if (excuse(field, contract.notCarried)) continue;
    differences.push({ field, kind: "added", after: value });
  }
  return { differences, declared: [...declared] };
};
