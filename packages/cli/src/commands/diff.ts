import type { KRD } from "@kaiord/core";
import { createDefaultProviders } from "@kaiord/core";
import chalk from "chalk";
import { z } from "zod";
import { formatError } from "../utils/error-formatter.js";
import { readFile } from "../utils/file-handler.js";
import {
  detectFormat,
  fileFormatSchema,
  type FileFormat,
} from "../utils/format-detector.js";
import { createLogger } from "../utils/logger-factory.js";

const diffOptionsSchema = z.object({
  file1: z.string(),
  file2: z.string(),
  format1: fileFormatSchema.optional(),
  format2: fileFormatSchema.optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type DiffOptions = z.infer<typeof diffOptionsSchema>;

type DiffResult = {
  identical: boolean;
  metadataDiff?: Array<{
    field: string;
    file1Value: unknown;
    file2Value: unknown;
  }>;
  stepsDiff?: {
    file1Count: number;
    file2Count: number;
    differences: Array<{
      stepIndex: number;
      field: string;
      file1Value: unknown;
      file2Value: unknown;
    }>;
  };
  extensionsDiff?: {
    file1Keys: Array<string>;
    file2Keys: Array<string>;
    differences: Array<{
      key: string;
      file1Value: unknown;
      file2Value: unknown;
    }>;
  };
};

/**
 * Load a file and convert it to KRD format
 */
const loadFileAsKrd = async (
  filePath: string,
  format: string | undefined,
  providers: ReturnType<typeof createDefaultProviders>
): Promise<KRD> => {
  // Detect format if not provided
  const detectedFormat = format || detectFormat(filePath);

  if (!detectedFormat) {
    throw new Error(
      `Unable to detect format for file: ${filePath}. ` +
        `Supported formats: .fit, .krd, .tcx, .zwo`
    );
  }

  // Read file
  const fileData = await readFile(filePath, detectedFormat as FileFormat);

  // Convert to KRD
  let krd: KRD;

  if (detectedFormat === "fit") {
    if (!(fileData instanceof Uint8Array)) {
      throw new Error("FIT input must be Uint8Array");
    }
    krd = await providers.convertFitToKrd({ fitBuffer: fileData });
  } else if (detectedFormat === "tcx") {
    if (typeof fileData !== "string") {
      throw new Error("TCX input must be string");
    }
    krd = await providers.convertTcxToKrd({ tcxString: fileData });
  } else if (detectedFormat === "zwo") {
    if (typeof fileData !== "string") {
      throw new Error("ZWO input must be string");
    }
    krd = await providers.convertZwiftToKrd({ zwiftString: fileData });
  } else if (detectedFormat === "krd") {
    if (typeof fileData !== "string") {
      throw new Error("KRD input must be string");
    }
    krd = JSON.parse(fileData) as KRD;
  } else {
    throw new Error(`Unsupported format: ${detectedFormat}`);
  }

  return krd;
};

/**
 * Compare two values and return true if they are different
 */
const isDifferent = (value1: unknown, value2: unknown): boolean => {
  // Handle null/undefined
  if (value1 === value2) return false;
  if (value1 === null || value1 === undefined) return true;
  if (value2 === null || value2 === undefined) return true;

  // Handle objects
  if (typeof value1 === "object" && typeof value2 === "object") {
    return JSON.stringify(value1) !== JSON.stringify(value2);
  }

  // Handle primitives
  return value1 !== value2;
};

/**
 * Compare metadata between two KRD files
 */
const compareMetadata = (
  krd1: KRD,
  krd2: KRD
): Array<{ field: string; file1Value: unknown; file2Value: unknown }> => {
  const differences: Array<{
    field: string;
    file1Value: unknown;
    file2Value: unknown;
  }> = [];

  const metadataFields = [
    "created",
    "manufacturer",
    "product",
    "serialNumber",
    "sport",
    "subSport",
  ] as const;

  for (const field of metadataFields) {
    const value1 = krd1.metadata[field];
    const value2 = krd2.metadata[field];

    if (isDifferent(value1, value2)) {
      differences.push({
        field,
        file1Value: value1,
        file2Value: value2,
      });
    }
  }

  return differences;
};

/**
 * Compare workout steps between two KRD files
 */
const compareSteps = (
  krd1: KRD,
  krd2: KRD
): {
  file1Count: number;
  file2Count: number;
  differences: Array<{
    stepIndex: number;
    field: string;
    file1Value: unknown;
    file2Value: unknown;
  }>;
} => {
  const workout1 = krd1.extensions?.workout as
    | { steps?: Array<unknown> }
    | undefined;
  const workout2 = krd2.extensions?.workout as
    | { steps?: Array<unknown> }
    | undefined;

  const steps1 = workout1?.steps || [];
  const steps2 = workout2?.steps || [];

  const differences: Array<{
    stepIndex: number;
    field: string;
    file1Value: unknown;
    file2Value: unknown;
  }> = [];

  // Compare step counts
  const maxSteps = Math.max(steps1.length, steps2.length);

  for (let i = 0; i < maxSteps; i++) {
    const step1 = steps1[i] as Record<string, unknown> | undefined;
    const step2 = steps2[i] as Record<string, unknown> | undefined;

    if (!step1 && step2) {
      differences.push({
        stepIndex: i,
        field: "step",
        file1Value: undefined,
        file2Value: step2,
      });
      continue;
    }

    if (step1 && !step2) {
      differences.push({
        stepIndex: i,
        field: "step",
        file1Value: step1,
        file2Value: undefined,
      });
      continue;
    }

    if (!step1 || !step2) continue;

    // Compare step fields
    const stepFields = [
      "stepIndex",
      "name",
      "durationType",
      "duration",
      "targetType",
      "target",
      "intensity",
      "notes",
      "equipment",
    ];

    for (const field of stepFields) {
      const value1 = step1[field];
      const value2 = step2[field];

      if (isDifferent(value1, value2)) {
        differences.push({
          stepIndex: i,
          field,
          file1Value: value1,
          file2Value: value2,
        });
      }
    }
  }

  return {
    file1Count: steps1.length,
    file2Count: steps2.length,
    differences,
  };
};

/**
 * Compare extensions between two KRD files
 */
const compareExtensions = (
  krd1: KRD,
  krd2: KRD
): {
  file1Keys: Array<string>;
  file2Keys: Array<string>;
  differences: Array<{
    key: string;
    file1Value: unknown;
    file2Value: unknown;
  }>;
} => {
  const ext1 = krd1.extensions || {};
  const ext2 = krd2.extensions || {};

  const keys1 = Object.keys(ext1);
  const keys2 = Object.keys(ext2);

  const allKeys = new Set([...keys1, ...keys2]);
  const differences: Array<{
    key: string;
    file1Value: unknown;
    file2Value: unknown;
  }> = [];

  for (const key of allKeys) {
    const value1 = ext1[key];
    const value2 = ext2[key];

    if (isDifferent(value1, value2)) {
      differences.push({
        key,
        file1Value: value1,
        file2Value: value2,
      });
    }
  }

  return {
    file1Keys: keys1,
    file2Keys: keys2,
    differences,
  };
};

/**
 * Format diff result for pretty terminal output
 */
const formatDiffPretty = (
  result: DiffResult,
  file1: string,
  file2: string
): string => {
  if (result.identical) {
    return chalk.green("✓ Files are identical");
  }

  const lines: Array<string> = [];
  lines.push(chalk.yellow(`\nComparing: ${file1} vs ${file2}\n`));

  // Metadata differences
  if (result.metadataDiff && result.metadataDiff.length > 0) {
    lines.push(chalk.bold("Metadata Differences:"));
    for (const diff of result.metadataDiff) {
      lines.push(
        `  ${chalk.cyan(diff.field)}:`,
        `    ${chalk.red("-")} ${JSON.stringify(diff.file1Value)}`,
        `    ${chalk.green("+")} ${JSON.stringify(diff.file2Value)}`
      );
    }
    lines.push("");
  }

  // Steps differences
  if (result.stepsDiff && result.stepsDiff.differences.length > 0) {
    lines.push(chalk.bold("Workout Steps Differences:"));
    lines.push(
      `  Step count: ${result.stepsDiff.file1Count} vs ${result.stepsDiff.file2Count}`
    );

    for (const diff of result.stepsDiff.differences) {
      lines.push(
        `  Step ${diff.stepIndex} - ${chalk.cyan(diff.field)}:`,
        `    ${chalk.red("-")} ${JSON.stringify(diff.file1Value)}`,
        `    ${chalk.green("+")} ${JSON.stringify(diff.file2Value)}`
      );
    }
    lines.push("");
  }

  // Extensions differences
  if (result.extensionsDiff && result.extensionsDiff.differences.length > 0) {
    lines.push(chalk.bold("Extensions Differences:"));
    lines.push(
      `  Keys in file1: ${result.extensionsDiff.file1Keys.join(", ")}`,
      `  Keys in file2: ${result.extensionsDiff.file2Keys.join(", ")}`
    );

    for (const diff of result.extensionsDiff.differences) {
      lines.push(
        `  ${chalk.cyan(diff.key)}:`,
        `    ${chalk.red("-")} ${JSON.stringify(diff.file1Value)}`,
        `    ${chalk.green("+")} ${JSON.stringify(diff.file2Value)}`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
};

/**
 * Diff command - compare two workout files
 */
export const diffCommand = async (options: DiffOptions): Promise<number> => {
  // Parse and validate command options
  const validatedOptions = diffOptionsSchema.parse(options);

  // Create logger
  const logger = await createLogger({
    type: validatedOptions.logFormat,
    level: validatedOptions.verbose
      ? "debug"
      : validatedOptions.quiet
        ? "error"
        : "info",
    quiet: validatedOptions.quiet,
  });

  try {
    // Get providers
    const providers = createDefaultProviders(logger);

    logger.debug("Loading files for comparison", {
      file1: validatedOptions.file1,
      file2: validatedOptions.file2,
    });

    // Load both files as KRD
    const krd1 = await loadFileAsKrd(
      validatedOptions.file1,
      validatedOptions.format1,
      providers
    );
    const krd2 = await loadFileAsKrd(
      validatedOptions.file2,
      validatedOptions.format2,
      providers
    );

    logger.debug("Files loaded successfully");

    // Compare files
    const metadataDiff = compareMetadata(krd1, krd2);
    const stepsDiff = compareSteps(krd1, krd2);
    const extensionsDiff = compareExtensions(krd1, krd2);

    const identical =
      metadataDiff.length === 0 &&
      stepsDiff.differences.length === 0 &&
      extensionsDiff.differences.length === 0;

    const result: DiffResult = {
      identical,
      metadataDiff: metadataDiff.length > 0 ? metadataDiff : undefined,
      stepsDiff: stepsDiff.differences.length > 0 ? stepsDiff : undefined,
      extensionsDiff:
        extensionsDiff.differences.length > 0 ? extensionsDiff : undefined,
    };

    // Output results
    if (validatedOptions.json) {
      console.log(
        JSON.stringify(
          {
            success: true,
            file1: validatedOptions.file1,
            file2: validatedOptions.file2,
            ...result,
          },
          null,
          2
        )
      );
    } else {
      const output = formatDiffPretty(
        result,
        validatedOptions.file1,
        validatedOptions.file2
      );
      console.log(output);
    }

    // Exit with code 0 if identical, 1 if different
    return identical ? 0 : 1;
  } catch (error) {
    logger.error("Diff command failed", { error });

    const formattedError = formatError(error, {
      json: validatedOptions.json,
    });

    if (validatedOptions.json) {
      console.log(formattedError);
    } else {
      console.error(formattedError);
    }

    return 99; // Unknown error
  }
};
