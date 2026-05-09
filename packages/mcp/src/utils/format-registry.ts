import type {
  BinaryReader,
  BinaryWriter,
  Logger,
  TextReader,
  TextWriter,
} from "@kaiord/core";
import { validateKrd } from "@kaiord/core";

import type { FileFormat } from "../types/tool-schemas";

type ReaderFactory = (logger: Logger) => Promise<BinaryReader | TextReader>;
type WriterFactory = (logger: Logger) => Promise<BinaryWriter | TextWriter>;

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
    createReader: async (l) => {
      const { createFitReader } = await import("@kaiord/fit");
      return createFitReader(l);
    },
    createWriter: async (l) => {
      const { createFitWriter } = await import("@kaiord/fit");
      return createFitWriter(l);
    },
  },
  tcx: {
    name: "TCX",
    extension: ".tcx",
    description: "Training Center XML",
    binary: false,
    createReader: async (l) => {
      const { createTcxReader } = await import("@kaiord/tcx");
      return createTcxReader(l);
    },
    createWriter: async (l) => {
      const { createTcxWriter } = await import("@kaiord/tcx");
      return createTcxWriter(l);
    },
  },
  zwo: {
    name: "ZWO",
    extension: ".zwo",
    description: "Zwift workout XML",
    binary: false,
    createReader: async (l) => {
      const { createZwiftReader } = await import("@kaiord/zwo");
      return createZwiftReader(l);
    },
    createWriter: async (l) => {
      const { createZwiftWriter } = await import("@kaiord/zwo");
      return createZwiftWriter(l);
    },
  },
  gcn: {
    name: "GCN",
    extension: ".gcn",
    description: "Garmin Connect workout JSON",
    binary: false,
    createReader: async (l) => {
      const { createGarminReader } = await import("@kaiord/garmin");
      return createGarminReader(l);
    },
    createWriter: async (l) => {
      const { createGarminWriter } = await import("@kaiord/garmin");
      return createGarminWriter(l);
    },
  },
  krd: {
    name: "KRD",
    extension: ".krd",
    description: "Kaiord canonical JSON format",
    binary: false,
    createReader: async () => createKrdReader(),
    createWriter: async () => createKrdWriter(),
  },
};

export { detectFormatFromPath } from "./detect-format-from-path";
