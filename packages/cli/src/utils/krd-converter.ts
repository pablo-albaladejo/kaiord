import type { KRD, Logger } from "@kaiord/core";
import { fromBinary, fromText, toBinary, toText } from "@kaiord/core";
import { createFitReader, createFitWriter } from "@kaiord/fit";
import { createGarminReader, createGarminWriter } from "@kaiord/garmin";
import { createTcxReader, createTcxWriter } from "@kaiord/tcx";
import { createZwiftReader, createZwiftWriter } from "@kaiord/zwo";
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

/** Convert raw file data to KRD format */
export const convertToKrd = async (
  data: Uint8Array | string,
  format: string,
  logger: Logger
): Promise<KRD> => {
  switch (format) {
    case "fit": {
      if (!(data instanceof Uint8Array)) {
        throw new Error("FIT input must be Uint8Array");
      }
      return fromBinary(data, createFitReader(logger), logger);
    }
    case "tcx": {
      if (typeof data !== "string") {
        throw new Error("TCX input must be string");
      }
      return fromText(data, createTcxReader(logger), logger);
    }
    case "zwo": {
      if (typeof data !== "string") {
        throw new Error("ZWO input must be string");
      }
      return fromText(data, createZwiftReader(logger), logger);
    }
    case "gcn": {
      if (typeof data !== "string") {
        throw new Error("GCN input must be string");
      }
      return fromText(data, createGarminReader(logger), logger);
    }
    case "krd": {
      if (typeof data !== "string") {
        throw new Error("KRD input must be string");
      }
      return JSON.parse(data) as KRD;
    }
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

/** Convert KRD to output format */
export const convertFromKrd = async (
  krd: KRD,
  format: string,
  logger: Logger
): Promise<Uint8Array | string> => {
  switch (format) {
    case "fit":
      return toBinary(krd, createFitWriter(logger), logger);
    case "tcx":
      return toText(krd, createTcxWriter(logger), logger);
    case "zwo":
      return toText(krd, createZwiftWriter(logger), logger);
    case "gcn":
      return toText(krd, createGarminWriter(logger), logger);
    case "krd":
      return JSON.stringify(krd, null, 2);
    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
};
