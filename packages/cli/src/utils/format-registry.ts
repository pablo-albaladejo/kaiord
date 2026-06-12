import { z } from "zod";

/**
 * Single source of truth for the CLI format vocabulary. Every format fact the
 * CLI consumes — codes, extensions, binary-ness, human descriptions — derives
 * from this registry. The zod enum, yargs `choices`, converter dispatch,
 * extension detection, and every "Supported formats" message reference it, so a
 * format code appears as a string literal nowhere else (tests excepted).
 *
 * Mirrors the shape of `packages/mcp/src/utils/format-registry.ts`. The CLI
 * keeps its own copy rather than depending on `@kaiord/mcp`; reader/writer
 * factories live in `krd-loaders.ts` and are not part of this descriptor.
 */
export type FormatDescriptor = {
  readonly name: string;
  readonly extension: string;
  readonly binary: boolean;
  readonly description: string;
};

export const FORMAT_REGISTRY = {
  fit: {
    name: "FIT",
    extension: ".fit",
    binary: true,
    description: "Garmin FIT binary protocol",
  },
  gcn: {
    name: "GCN",
    extension: ".gcn",
    binary: false,
    description: "Garmin Connect workout JSON",
  },
  krd: {
    name: "KRD",
    extension: ".krd",
    binary: false,
    description: "Kaiord canonical JSON format",
  },
  tcx: {
    name: "TCX",
    extension: ".tcx",
    binary: false,
    description: "Training Center XML",
  },
  zwo: {
    name: "ZWO",
    extension: ".zwo",
    binary: false,
    description: "Zwift workout XML",
  },
} as const satisfies Record<string, FormatDescriptor>;

export type FileFormat = keyof typeof FORMAT_REGISTRY;

/** Format codes in stable (alphabetical) order for enums and yargs choices. */
export const FORMAT_CODES = Object.keys(
  FORMAT_REGISTRY
).sort() as Array<FileFormat>;

/** Zod enum over the registry codes. */
export const fileFormatSchema = z.enum(
  FORMAT_CODES as [FileFormat, ...Array<FileFormat>]
);

/** Map of lowercase extension (including dot) to format code. */
export const EXTENSION_TO_FORMAT: Record<string, FileFormat> =
  Object.fromEntries(
    FORMAT_CODES.map((code) => [FORMAT_REGISTRY[code].extension, code])
  ) as Record<string, FileFormat>;

/** Comma-separated extension list, e.g. ".fit, .gcn, .krd, .tcx, .zwo". */
export const SUPPORTED_EXTENSIONS = FORMAT_CODES.map(
  (code) => FORMAT_REGISTRY[code].extension
).join(", ");

/** Comma-separated code list, e.g. "fit, gcn, krd, tcx, zwo". */
export const SUPPORTED_FORMAT_CODES = FORMAT_CODES.join(", ");

/** True for formats whose payload is binary rather than text. */
export const isBinaryFormat = (format: FileFormat): boolean =>
  FORMAT_REGISTRY[format].binary;
