import type { KRD, Logger } from "@kaiord/core";
import {
  fromBinary,
  fromText,
  toBinary,
  toText,
  validateKrd,
} from "@kaiord/core";

import { readFile } from "./file-handler";
import { detectFormat, type FileFormat } from "./format-detector";

/** Load a file and convert it to KRD format */
export const loadFileAsKrd = async (
  filePath: string,
  format: string | undefined,
  logger: Logger
): Promise<KRD> => {
  const detectedFormat = format || detectFormat(filePath);

  if (!detectedFormat) {
    throw new Error(
      `Unable to detect format for file: ${filePath}. ` +
        `Supported formats: .fit, .gcn, .krd, .tcx, .zwo`
    );
  }

  const fileData = await readFile(filePath, detectedFormat as FileFormat);

  return convertToKrd(fileData, detectedFormat, logger);
};

const fitToKrd = async (data: Uint8Array | string, logger: Logger) => {
  if (!(data instanceof Uint8Array)) throw new Error("FIT input must be Uint8Array");
  const { createFitReader } = await import("@kaiord/fit");
  return fromBinary(data, createFitReader(logger), logger);
};

const tcxToKrd = async (data: Uint8Array | string, logger: Logger) => {
  if (typeof data !== "string") throw new Error("TCX input must be string");
  const { createTcxReader } = await import("@kaiord/tcx");
  return fromText(data, createTcxReader(logger), logger);
};

const zwoToKrd = async (data: Uint8Array | string, logger: Logger) => {
  if (typeof data !== "string") throw new Error("ZWO input must be string");
  const { createZwiftReader } = await import("@kaiord/zwo");
  return fromText(data, createZwiftReader(logger), logger);
};

const gcnToKrd = async (data: Uint8Array | string, logger: Logger) => {
  if (typeof data !== "string") throw new Error("GCN input must be string");
  const { createGarminReader } = await import("@kaiord/garmin");
  return fromText(data, createGarminReader(logger), logger);
};

const krdToKrd = (data: Uint8Array | string): KRD => {
  if (typeof data !== "string") throw new Error("KRD input must be string");
  return validateKrd(JSON.parse(data));
};

/** Convert raw file data to KRD format */
export const convertToKrd = async (
  data: Uint8Array | string,
  format: string,
  logger: Logger
): Promise<KRD> => {
  switch (format) {
    case "fit": return fitToKrd(data, logger);
    case "tcx": return tcxToKrd(data, logger);
    case "zwo": return zwoToKrd(data, logger);
    case "gcn": return gcnToKrd(data, logger);
    case "krd": return krdToKrd(data);
    default: throw new Error(`Unsupported format: ${format}`);
  }
};

/** Convert KRD to output format */
export const convertFromKrd = async (
  krd: KRD,
  format: string,
  logger: Logger
): Promise<Uint8Array | string> => {
  switch (format) {
    case "fit": {
      const { createFitWriter } = await import("@kaiord/fit");
      return toBinary(krd, createFitWriter(logger), logger);
    }
    case "tcx": {
      const { createTcxWriter } = await import("@kaiord/tcx");
      return toText(krd, createTcxWriter(logger), logger);
    }
    case "zwo": {
      const { createZwiftWriter } = await import("@kaiord/zwo");
      return toText(krd, createZwiftWriter(logger), logger);
    }
    case "gcn": {
      const { createGarminWriter } = await import("@kaiord/garmin");
      return toText(krd, createGarminWriter(logger), logger);
    }
    case "krd":
      validateKrd(krd);
      return JSON.stringify(krd, null, 2);
    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
};
