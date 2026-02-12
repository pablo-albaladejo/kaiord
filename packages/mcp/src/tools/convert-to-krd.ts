import { fromBinary, fromText } from "@kaiord/core";
import type { BinaryReader, KRD, Logger, TextReader } from "@kaiord/core";

import type { FileFormat } from "../types/tool-schemas";
import { isBinaryFormat } from "../types/tool-schemas";
import { decodeBase64 } from "../utils/base64";
import { readFileAsBuffer, readFileAsText } from "../utils/file-io";
import {
  FORMAT_REGISTRY,
  detectFormatFromPath,
} from "../utils/format-registry";

export const convertToKrd = async (
  inputFile: string | undefined,
  inputContent: string | undefined,
  inputFormat: FileFormat | undefined,
  logger: Logger
): Promise<KRD> => {
  const format = resolveInputFormat(inputFile, inputContent, inputFormat);

  if (isBinaryFormat(format)) {
    return readBinaryInput(inputFile, inputContent, format, logger);
  }

  return readTextInput(inputFile, inputContent, format, logger);
};

const resolveInputFormat = (
  inputFile: string | undefined,
  inputContent: string | undefined,
  inputFormat: FileFormat | undefined
): FileFormat => {
  if (inputFormat) return inputFormat;
  if (inputFile) {
    const detected = detectFormatFromPath(inputFile);
    if (detected) return detected;
  }
  throw new Error("Cannot detect format. Provide input_format explicitly.");
};

const readBinaryInput = async (
  inputFile: string | undefined,
  inputContent: string | undefined,
  format: FileFormat,
  logger: Logger
): Promise<KRD> => {
  const reader = FORMAT_REGISTRY[format].createReader(logger) as BinaryReader;
  if (!inputFile && inputContent === undefined) {
    throw new Error("Provide either input_file or input_content");
  }
  const buffer = inputFile
    ? await readFileAsBuffer(inputFile)
    : decodeBase64(inputContent as string);
  return fromBinary(buffer, reader, logger);
};

const readTextInput = async (
  inputFile: string | undefined,
  inputContent: string | undefined,
  format: FileFormat,
  logger: Logger
): Promise<KRD> => {
  const reader = FORMAT_REGISTRY[format].createReader(logger) as TextReader;
  if (!inputFile && inputContent === undefined) {
    throw new Error("Provide either input_file or input_content");
  }
  const text = inputFile
    ? await readFileAsText(inputFile)
    : (inputContent as string);
  return fromText(text, reader, logger);
};
