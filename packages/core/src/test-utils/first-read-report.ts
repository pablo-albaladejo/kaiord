import { matchesField } from "../application/round-trip/contract/field-pattern";
import { leavesOf } from "../application/round-trip/contract/krd-leaves";

type Rec = Record<string, unknown>;

/** One value of a source file, as an independent reader of the format sees it. */
export type SourceValue = {
  field: string;
  value: unknown;
  /** The record that holds the value (its element, message or object). */
  context: Rec;
  /** Every record around the value, outermost first (the file, the step…). */
  ancestors: ReadonlyArray<Rec>;
};

/**
 * What the first read makes of a source field: a KRD value under one of
 * `krd` (after `as`), a field `notCarried` with its reason, or the same bytes
 * as a sibling field `sameAs` that is itself checked. A rule with `when`
 * applies only to the values whose record passes it.
 */
export type SourceField = {
  source: string;
  when?: (context: Rec, ancestors: ReadonlyArray<Rec>) => boolean;
  krd?: ReadonlyArray<string>;
  as?: (value: unknown, context: Rec) => unknown;
  notCarried?: string;
  sameAs?: string;
  reason?: string;
};

export type FirstReadFixture = {
  name: string;
  values: ReadonlyArray<SourceValue>;
  krd: unknown;
};

const same = (a: unknown, b: unknown): boolean =>
  typeof a === "number" && typeof b === "number"
    ? Math.abs(a - b) < 1e-9
    : a === b;

const takeLeaf = (
  leaves: Map<string, unknown>,
  patterns: ReadonlyArray<string>,
  expected: unknown
): boolean => {
  for (const [path, value] of leaves) {
    if (!patterns.some((p) => matchesField(path, p))) continue;
    if (!same(value, expected)) continue;
    leaves.delete(path);
    return true;
  }
  return false;
};

const problemOf = (
  rule: SourceField | undefined,
  v: SourceValue,
  leaves: Map<string, unknown>
): string | null => {
  const shown = `${v.field} ${JSON.stringify(v.value)}`;
  if (!rule) return `${shown} is listed neither as carried nor as not carried`;
  if (rule.notCarried !== undefined) return null;
  if (rule.sameAs !== undefined)
    return v.context[rule.sameAs] === undefined
      ? `${shown} is read as ${rule.sameAs}, which the source does not hold`
      : null;
  const expected = rule.as ? rule.as(v.value, v.context) : v.value;
  return takeLeaf(leaves, rule.krd ?? [], expected)
    ? null
    : `${shown} is not in the KRD after the first read`;
};

/**
 * Checks the first read of real files: every value the source holds must be
 * in the KRD the format's reader made of it, or be declared. Each KRD value
 * answers one source value, so a dropped repeat is found too. `unused` names
 * the rules no value needed.
 */
export const firstReadReport = (
  fields: ReadonlyArray<SourceField>,
  fixtures: ReadonlyArray<FirstReadFixture>
): { problems: Array<string>; unused: Array<string> } => {
  const used = new Set<number>();
  const problems: Array<string> = [];
  for (const fixture of fixtures) {
    const leaves = leavesOf(fixture.krd);
    for (const v of fixture.values) {
      const index = fields.findIndex(
        (r) =>
          matchesField(v.field, r.source) &&
          (r.when?.(v.context, v.ancestors) ?? true)
      );
      if (index >= 0) used.add(index);
      const problem = problemOf(fields[index], v, leaves);
      if (problem) problems.push(`${fixture.name}: ${problem}`);
    }
  }
  const unused = fields.filter((_, i) => !used.has(i)).map((r) => r.source);
  return { problems, unused };
};
