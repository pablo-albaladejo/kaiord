import type { BinaryWriter, KRD, Logger, TextWriter } from "@kaiord/core";
import { toBinary, toText } from "@kaiord/core";

import type { FileFormat } from "../types/tool-schemas";
import { isBinaryFormat } from "../types/tool-schemas";
import { encodeBase64 } from "../utils/base64";
import { writeOutputFile } from "../utils/file-io";
import { FORMAT_REGISTRY, type WriterOptions } from "../utils/format-registry";

export const BASE64_HEADER = "Binary output, base64-encoded";

export type ConvertFromKrdResult = {
  readonly content: string;
  readonly writtenTo: string | null;
};

export type ConvertFromKrdContext = WriterOptions & { logger: Logger };

export const convertFromKrd = async (
  krd: KRD,
  outputFormat: FileFormat,
  outputFile: string | undefined,
  context: ConvertFromKrdContext
): Promise<ConvertFromKrdResult> => {
  if (!FORMAT_REGISTRY[outputFormat]) {
    const error = new Error(
      `Unsupported output format: ${String(outputFormat)}`
    );
    error.name = "UnsupportedFormatError";
    throw error;
  }
  if (isBinaryFormat(outputFormat)) {
    return writeBinaryOutput(krd, outputFormat, outputFile, context);
  }
  return writeTextOutput(krd, outputFormat, outputFile, context);
};

const writeBinaryOutput = async (
  krd: KRD,
  format: FileFormat,
  outputFile: string | undefined,
  { logger, fitWriter }: ConvertFromKrdContext
): Promise<ConvertFromKrdResult> => {
  const writer = (await FORMAT_REGISTRY[format].createWriter(logger, {
    fitWriter,
  })) as BinaryWriter;
  const buffer = await toBinary(krd, writer, logger);
  if (!outputFile) {
    return {
      content: `${BASE64_HEADER} (${buffer.length} bytes):\n${encodeBase64(buffer)}`,
      writtenTo: null,
    };
  }
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
  { logger, ftpWatts }: ConvertFromKrdContext
): Promise<ConvertFromKrdResult> => {
  const writer = (await FORMAT_REGISTRY[format].createWriter(logger, {
    ftpWatts,
  })) as TextWriter;
  const text = await toText(krd, writer, logger);
  if (outputFile) {
    await writeOutputFile(outputFile, text);
  }
  return { content: text, writtenTo: outputFile ?? null };
};
