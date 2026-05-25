import type { KRD, Logger } from "@kaiord/core";

import { convertToKrd } from "../convert-to-krd";

const PARSE_FAILURE_LOG = "Skipping health input file (parse failure)";

export type ParsedHealthRecords = {
  records: KRD[];
  skipped: number;
};

/**
 * Parses an array of input file paths into KRDs by delegating to
 * `convertToKrd` per file. Errors on individual files are caught and
 * counted in `skipped` so a bad input never aborts the batch.
 */
export const parseHealthRecords = async (
  inputFiles: string[],
  logger: Logger
): Promise<ParsedHealthRecords> => {
  const records: KRD[] = [];
  let skipped = 0;
  for (const file of inputFiles) {
    try {
      const krd = await convertToKrd(file, undefined, undefined, logger);
      records.push(krd);
    } catch {
      skipped += 1;
      logger.warn(PARSE_FAILURE_LOG);
    }
  }
  return { records, skipped };
};
