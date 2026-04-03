import { createToleranceChecker, validateRoundTrip } from "@kaiord/core";
import { createFitReader, createFitWriter } from "@kaiord/fit";
import { z } from "zod";
import { formatError, formatSuccess } from "../utils/error-formatter";
import { readFileAsBuffer } from "../utils/file-io";
import type { Logger, ToleranceViolation } from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const TOOL_NAME = "kaiord_round_trip_validate";
const TOOL_DESC =
  "Validate round-trip FIT conversion (FIT → KRD → FIT) and report tolerance violations";

const inputSchema = {
  input_file: z.string().describe("Path to a FIT file to validate"),
};

const formatViolations = (violations: Array<ToleranceViolation>): string => {
  const header = `Round-trip validation failed with ${violations.length} violation(s):\n`;
  const lines = violations.map(
    (v) =>
      `  ${v.field}: expected ${v.expected}, got ${v.actual} ` +
      `(deviation: ${v.deviation}, tolerance: ${v.tolerance})`
  );
  return header + lines.join("\n");
};

export const registerRoundTripValidateTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(TOOL_NAME, TOOL_DESC, inputSchema, async (args) => {
    try {
      logger.debug("Reading FIT file for round-trip validation");
      const fitData = await readFileAsBuffer(args.input_file);
      const checker = createToleranceChecker(undefined);
      const validator = validateRoundTrip(
        createFitReader(logger),
        createFitWriter(logger),
        checker,
        logger
      );

      const violations = await validator.validateFitToKrdToFit({
        originalFit: fitData,
      });

      if (violations.length === 0) {
        return formatSuccess("Round-trip validation passed. No violations.");
      }
      return formatSuccess(formatViolations(violations));
    } catch (error) {
      return formatError(error);
    }
  });
};
