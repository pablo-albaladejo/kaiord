import type { Train2GoBandKey } from "./train2go-zones-payload";

// DOM names are 0-indexed (`z3_upper` is visual Z4); payload keys are
// 1-indexed (`z4`).
export const DOM_BANDS: ReadonlyArray<readonly [number, Train2GoBandKey]> = [
  [0, "z1"],
  [1, "z2"],
  [2, "z3"],
  [3, "z4"],
  [4, "z5"],
];

const matchNumericGroup = (block: string, re: RegExp): number | undefined => {
  const m = block.match(re);
  if (!m) return undefined;
  const num = Number(m[1] ?? m[2]);
  return Number.isFinite(num) ? num : undefined;
};

const escapeForRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// `name="X"` and `value="N"` may appear in either order inside one tag.
export const extractInputValueAsNumber = (
  block: string,
  name: string
): number | undefined =>
  matchNumericGroup(
    block,
    new RegExp(
      `<input[^>]*\\bname="${name}"[^>]*\\bvalue="([\\d.]+)"|` +
        `<input[^>]*\\bvalue="([\\d.]+)"[^>]*\\bname="${name}"`,
      "i"
    )
  );

// Names look like `measurement[z3_upper][0]`; match by suffix.
export const extractInputValueByNameSuffix = (
  block: string,
  suffix: string
): number | undefined =>
  matchNumericGroup(
    block,
    new RegExp(
      `\\bname="[^"]*${escapeForRegex(suffix)}"[^>]*\\bvalue="([\\d.]+)"|` +
        `\\bvalue="([\\d.]+)"[^>]*\\bname="[^"]*${escapeForRegex(suffix)}"`,
      "i"
    )
  );

export const extractHrBandValue = (
  block: string,
  name: string
): number | undefined =>
  matchNumericGroup(
    block,
    new RegExp(
      `\\bname="${name}"[^>]*\\bvalue="(\\d+)"|\\bvalue="(\\d+)"[^>]*\\bname="${name}"`,
      "i"
    )
  );
