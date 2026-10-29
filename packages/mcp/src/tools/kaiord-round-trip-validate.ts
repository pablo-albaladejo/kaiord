import type {
  BinaryReader,
  BinaryWriter,
  ToleranceViolation,
} from "@kaiord/core";
import {
  createToleranceChecker,
  fromBinary,
  validateRoundTrip,
} from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { decodeBase64 } from "../utils/base64";
import { formatError, formatSuccess } from "../utils/error-formatter";
import { readFileAsBuffer } from "../utils/file-io";
import { FORMAT_REGISTRY } from "../utils/format-registry";
import { validateExclusiveInput } from "../utils/resolve-input";
import { registerKaiordTool } from "./register-kaiord-tool";
import type { ToolContext } from "./tool-context";
import { admitKrd } from "./tool-context";

const TOOL_NAME = "kaiord_round_trip_validate";
const TOOL_DESC =
  "Validate round-trip FIT conversion (FIT → KRD → FIT) and report tolerance violations";

const inputSchema = {
  input_file: z.string().optional().describe("Path to a FIT file to validate"),
  input_content: z.string().optional().describe("Base64-encoded FIT file"),
};

export const formatViolations = (
  violations: Array<ToleranceViolation>
): string => {
  const header = `Round-trip validation failed with ${violations.length} violation(s):\n`;
  const lines = violations.map((v) =>
    v.expectedValue === undefined
      ? `  ${v.field}: expected ${v.expected}, got ${v.actual} ` +
        `(deviation: ${v.deviation}, tolerance: ${v.tolerance})`
      : `  ${v.field}: expected ${v.expectedValue}, got ${v.actualValue}`
  );
  return header + lines.join("\n");
};

const runRoundTrip = async (
  context: ToolContext,
  originalFit: Uint8Array
): Promise<Array<ToleranceViolation>> => {
  const { logger, fitWriter } = context;
  const fit = FORMAT_REGISTRY.fit;
  const reader = (await fit.createReader(logger)) as BinaryReader;
  const writer = (await fit.createWriter(logger, {
    fitWriter,
  })) as BinaryWriter;
  admitKrd(context, await fromBinary(originalFit, reader, logger));
  const checker = createToleranceChecker(undefined);
  const validator = validateRoundTrip(reader, writer, checker, logger);
  return validator.validateFitToKrdToFit({ originalFit });
};

export const registerRoundTripValidateTool = (
  server: McpServer,
  context: ToolContext
): void => {
  const tool = { name: TOOL_NAME, description: TOOL_DESC, shape: inputSchema };
  registerKaiordTool(
    server,
    { ...tool, remote: context.remote },
    async (args) => {
      try {
        validateExclusiveInput(args.input_file, args.input_content);
        context.logger.debug("Reading FIT file for round-trip validation");
        const fitData = args.input_file
          ? await readFileAsBuffer(args.input_file)
          : decodeBase64(args.input_content as string);
        const violations = await runRoundTrip(context, fitData);
        if (violations.length === 0) {
          return formatSuccess("Round-trip validation passed. No violations.");
        }
        return formatSuccess(formatViolations(violations));
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
