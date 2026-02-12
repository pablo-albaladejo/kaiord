import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { createStderrLogger } from "../adapters/stderr-logger";
import { registerAnalyzeWorkoutPrompt } from "../prompts/analyze-workout";
import { registerConvertFilePrompt } from "../prompts/convert-file";
import { registerKrdFormatSpecResource } from "../resources/krd-format-spec";
import { registerKrdSchemaResource } from "../resources/krd-schema";
import { registerSupportedFormatsResource } from "../resources/supported-formats";
import { registerConvertTool } from "../tools/kaiord-convert";
import { registerDiffTool } from "../tools/kaiord-diff";
import { registerExtractWorkoutTool } from "../tools/kaiord-extract-workout";
import { registerGetFormatSpecTool } from "../tools/kaiord-get-format-spec";
import { registerInspectTool } from "../tools/kaiord-inspect";
import { registerListFormatsTool } from "../tools/kaiord-list-formats";
import { registerValidateTool } from "../tools/kaiord-validate";

const SERVER_NAME = "kaiord-mcp";
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "../../package.json"), "utf-8")
) as { version: string };

const SERVER_INSTRUCTIONS = [
  "Kaiord is a fitness data framework. KRD is the canonical JSON format — all conversions go through KRD.",
  "BEFORE creating or editing KRD documents, call the kaiord_get_format_spec tool to get the full specification.",
  "Use kaiord_list_formats to discover all supported formats (FIT, TCX, ZWO, GCN, KRD).",
].join("\n");

export const createServer = (): McpServer => {
  const server = new McpServer(
    { name: SERVER_NAME, version: pkg.version },
    { instructions: SERVER_INSTRUCTIONS }
  );
  const logger = createStderrLogger();

  registerGetFormatSpecTool(server);
  registerListFormatsTool(server);
  registerConvertTool(server, logger);
  registerValidateTool(server, logger);
  registerInspectTool(server, logger);
  registerExtractWorkoutTool(server, logger);
  registerDiffTool(server, logger);

  registerKrdSchemaResource(server);
  registerSupportedFormatsResource(server);
  registerKrdFormatSpecResource(server);

  registerConvertFilePrompt(server);
  registerAnalyzeWorkoutPrompt(server);

  return server;
};
