import type { KRD, Logger } from "@kaiord/core";

import { UnsupportedFormatError } from "./cli-errors";
import { readFile } from "./file-handler";
import { detectFormat } from "./format-detector";
import {
  type FileFormat,
  SUPPORTED_EXTENSIONS,
} from "./format-registry";
import {
  fitToKrd,
  gcnToKrd,
  krdToFit,
  krdToGcn,
  krdToKrd,
  krdToTcx,
  krdToText,
  krdToZwo,
  tcxToKrd,
  zwoToKrd,
} from "./krd-loaders";

/** Load a file and convert it to KRD format */
export const loadFileAsKrd = async (
  filePath: string,
  format: string | undefined,
  logger: Logger
): Promise<KRD> => {
  const detectedFormat = format || detectFormat(filePath);

  if (!detectedFormat) {
    throw new UnsupportedFormatError(
      `Unable to detect format for file: ${filePath}. ` +
        `Supported formats: ${SUPPORTED_EXTENSIONS}`
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
  switch (format as FileFormat) {
    case "fit":
      return fitToKrd(data, logger);
    case "tcx":
      return tcxToKrd(data, logger);
    case "zwo":
      return zwoToKrd(data, logger);
    case "gcn":
      return gcnToKrd(data, logger);
    case "krd":
      return krdToKrd(data);
    default:
      throw new UnsupportedFormatError(`Unsupported format: ${format}`);
  }
};

/** Convert KRD to output format */
export const convertFromKrd = async (
  krd: KRD,
  format: string,
  logger: Logger
): Promise<Uint8Array | string> => {
  switch (format as FileFormat) {
    case "fit":
      return krdToFit(krd, logger);
    case "tcx":
      return krdToTcx(krd, logger);
    case "zwo":
      return krdToZwo(krd, logger);
    case "gcn":
      return krdToGcn(krd, logger);
    case "krd":
      return krdToText(krd);
    default:
      throw new UnsupportedFormatError(`Unsupported output format: ${format}`);
  }
};
