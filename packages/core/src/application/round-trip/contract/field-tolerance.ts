import { matchesField } from "./field-pattern";
import type { RoundTripContract } from "./round-trip-contract";

const valueAt = (root: unknown, segments: ReadonlyArray<string>): unknown =>
  segments.reduce<unknown>(
    (node, key) =>
      node !== null && typeof node === "object"
        ? (node as Record<string, unknown>)[key]
        : undefined,
    root
  );

/** A target value's type and unit, read from the target that holds `field`. */
const targetContext = (root: unknown, field: string) => {
  const segments = field.split(".");
  const at = segments.lastIndexOf("target");
  if (at < 0) return { type: undefined, unit: undefined };
  const target = valueAt(root, segments.slice(0, at + 1)) as
    { type?: string; value?: { unit?: string } } | undefined;
  return { type: target?.type, unit: target?.value?.unit };
};

/** The tolerance of the first rule that covers `field`, or 0 (exact). */
export const toleranceOf = (
  field: string,
  root: unknown,
  contract: RoundTripContract
): number => {
  const { type, unit } = targetContext(root, field);
  const rule = contract.tolerances.find(
    (t) =>
      matchesField(field, t.field) &&
      (t.targetType === undefined || t.targetType === type) &&
      (t.units === undefined || (unit !== undefined && t.units.includes(unit)))
  );
  return rule?.tolerance ?? 0;
};
