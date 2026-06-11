import { z } from "zod";

import { FORMAT_REGISTRY } from "../utils/format-registry";

export const formatSchema = z.enum(["fit", "tcx", "zwo", "gcn", "krd"]);

export type FileFormat = z.infer<typeof formatSchema>;

// Single source of truth: derive the binary set from the format registry so a
// new binary adapter only needs to flip `binary: true` in one place.
export const BINARY_FORMATS: ReadonlySet<FileFormat> = new Set(
  (Object.entries(FORMAT_REGISTRY) as Array<[FileFormat, { binary: boolean }]>)
    .filter(([, descriptor]) => descriptor.binary)
    .map(([format]) => format)
);

export const isBinaryFormat = (format: FileFormat): boolean =>
  BINARY_FORMATS.has(format);
