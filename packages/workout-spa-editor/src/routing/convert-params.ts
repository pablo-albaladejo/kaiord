/**
 * Converter deep link: `/convert?from=<fmt>&to=<fmt>` (read from the fragment
 * query through wouter's `useSearch()`). The docs converter pages link here
 * with the pair preselected. `garmin` is the public name of the GCN format;
 * `krd` is not a source anyone holds a file in, so it is not a valid `from`.
 * Anything invalid parses to `null` and the page shows the format picker.
 */
import {
  isValidFormat,
  type WorkoutFileFormat,
} from "../utils/file-format-detector";

export type ConvertPair = { from: WorkoutFileFormat; to: WorkoutFileFormat };

const ALIASES: Record<string, WorkoutFileFormat> = { garmin: "gcn" };

export const CONVERT_SOURCES: ReadonlyArray<WorkoutFileFormat> = [
  "fit",
  "tcx",
  "zwo",
  "gcn",
];

export const CONVERT_TARGETS: ReadonlyArray<WorkoutFileFormat> = [
  ...CONVERT_SOURCES,
  "krd",
];

const toFormat = (raw: string | null): WorkoutFileFormat | null => {
  const value = raw?.trim().toLowerCase() ?? "";
  const format = ALIASES[value] ?? value;
  return isValidFormat(format) ? format : null;
};

/** Each side of the link that is valid on its own, to seed the picker. */
export function partialConvertParams(search: string): Partial<ConvertPair> {
  const params = new URLSearchParams(search);
  const from = toFormat(params.get("from"));
  const to = toFormat(params.get("to"));
  return {
    ...(from && CONVERT_SOURCES.includes(from) ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

export function parseConvertParams(search: string): ConvertPair | null {
  const { from, to } = partialConvertParams(search);
  if (!from || !to || from === to) return null;
  return { from, to };
}

// Garmin Connect workouts are saved as JSON; `.gcn` is Kaiord's own name.
const ACCEPT: Record<WorkoutFileFormat, string> = {
  fit: ".fit",
  tcx: ".tcx",
  zwo: ".zwo",
  gcn: ".json,.gcn",
  krd: ".krd,.json",
};

export const acceptFor = (from: WorkoutFileFormat): string => ACCEPT[from];

export const convertHref = ({ from, to }: ConvertPair): string =>
  `/convert?from=${from}&to=${to}`;
