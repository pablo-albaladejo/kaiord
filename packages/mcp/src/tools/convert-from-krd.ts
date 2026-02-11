import { toBinary, toText } from "@kaiord/core";
import type { BinaryWriter, KRD, Logger, TextWriter } from "@kaiord/core";

import type { FileFormat } from "../types/tool-schemas";
import { isBinaryFormat } from "../types/tool-schemas";
import { writeOutputFile } from "../utils/file-io";
import { FORMAT_REGISTRY } from "../utils/format-registry";

export type ConvertFromKrdResult = {
  readonly content: string;
  readonly writtenTo: string | null;
};

export const convertFromKrd = async (
  krd: KRD,
  outputFormat: FileFormat,
  outputFile: string | undefined,
  logger: Logger
): Promise<ConvertFromKrdResult> => {
  if (isBinaryFormat(outputFormat)) {
    return writeBinaryOutput(krd, outputFormat, outputFile, logger);
  }
  return writeTextOutput(krd, outputFormat, outputFile, logger);
};

const writeBinaryOutput = async (
  krd: KRD,
  format: FileFormat,
  outputFile: string | undefined,
  logger: Logger
): Promise<ConvertFromKrdResult> => {
  if (!outputFile) {
    throw new Error("output_file is required for binary format (FIT)");
  }
  const writer = FORMAT_REGISTRY[format].createWriter(logger) as BinaryWriter;
  const buffer = await toBinary(krd, writer, logger);
  await writeOutputFile(outputFile, buffer);
  return {
    content: `Binary file written (${buffer.length} bytes)`,
    writtenTo: outputFile,
  };
};

const writeTextOutput = async (
  krd: KRD,
  format: FileFormat,
  outputFile: string | undefined,
  logger: Logger
): Promise<ConvertFromKrdResult> => {
  const writer = FORMAT_REGISTRY[format].createWriter(logger) as TextWriter;
  const text = await toText(krd, writer, logger);
  if (outputFile) {
    await writeOutputFile(outputFile, text);
  }
  return { content: text, writtenTo: outputFile ?? null };
};
