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
import { registerInspectTool } from "../tools/kaiord-inspect";
import { registerListFormatsTool } from "../tools/kaiord-list-formats";
import { registerValidateTool } from "../tools/kaiord-validate";

const SERVER_NAME = "kaiord-mcp";
const SERVER_VERSION = "1.0.0";

export const createServer = (): McpServer => {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });
  const logger = createStderrLogger();

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
