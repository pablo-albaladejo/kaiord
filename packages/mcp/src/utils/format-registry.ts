import type {
  BinaryReader,
  BinaryWriter,
  Logger,
  TextReader,
  TextWriter,
} from "@kaiord/core";
import { validateKrd } from "@kaiord/core";
import { createFitReader, createFitWriter } from "@kaiord/fit";
import { createGarminReader, createGarminWriter } from "@kaiord/garmin";
import { createTcxReader, createTcxWriter } from "@kaiord/tcx";
import { createZwiftReader, createZwiftWriter } from "@kaiord/zwo";
import { extname } from "path";

import type { FileFormat } from "../types/tool-schemas";

type ReaderFactory = (logger: Logger) => BinaryReader | TextReader;
type WriterFactory = (logger: Logger) => BinaryWriter | TextWriter;

export type FormatDescriptor = {
  readonly name: string;
  readonly extension: string;
  readonly description: string;
  readonly binary: boolean;
  readonly createReader: ReaderFactory;
  readonly createWriter: WriterFactory;
};

const createKrdReader = (): TextReader => async (text: string) =>
  validateKrd(JSON.parse(text));

const createKrdWriter = (): TextWriter => async (krd) => {
  validateKrd(krd);
  return JSON.stringify(krd, null, 2);
};

export const FORMAT_REGISTRY: Record<FileFormat, FormatDescriptor> = {
  fit: {
    name: "FIT",
    extension: ".fit",
    description: "Garmin FIT binary protocol",
    binary: true,
    createReader: (l) => createFitReader(l),
    createWriter: (l) => createFitWriter(l),
  },
  tcx: {
    name: "TCX",
    extension: ".tcx",
    description: "Training Center XML",
    binary: false,
    createReader: (l) => createTcxReader(l),
    createWriter: (l) => createTcxWriter(l),
  },
  zwo: {
    name: "ZWO",
    extension: ".zwo",
    description: "Zwift workout XML",
    binary: false,
    createReader: (l) => createZwiftReader(l),
    createWriter: (l) => createZwiftWriter(l),
  },
  gcn: {
    name: "GCN",
    extension: ".gcn",
    description: "Garmin Connect workout JSON",
    binary: false,
    createReader: (l) => createGarminReader(l),
    createWriter: (l) => createGarminWriter(l),
  },
  krd: {
    name: "KRD",
    extension: ".krd",
    description: "Kaiord canonical JSON format",
    binary: false,
    createReader: () => createKrdReader(),
    createWriter: () => createKrdWriter(),
  },
};

export const detectFormatFromPath = (filePath: string): FileFormat | null => {
  const ext = extname(filePath).toLowerCase();
  if (!ext) return null;
  const entry = Object.entries(FORMAT_REGISTRY).find(
    ([, desc]) => desc.extension === ext
  );
  return entry ? (entry[0] as FileFormat) : null;
};
