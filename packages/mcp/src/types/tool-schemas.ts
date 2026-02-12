import { z } from "zod";

export const formatSchema = z.enum(["fit", "tcx", "zwo", "gcn", "krd"]);

export type FileFormat = z.infer<typeof formatSchema>;

export const BINARY_FORMATS: ReadonlySet<FileFormat> = new Set(["fit"]);

export const isBinaryFormat = (format: FileFormat): boolean =>
  BINARY_FORMATS.has(format);
