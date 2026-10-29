import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerKrdFormatSpecResource } from "../resources/krd-format-spec";
import { registerKrdSchemaResource } from "../resources/krd-schema";
import { registerSupportedFormatsResource } from "../resources/supported-formats";
import { registerConvertTool } from "../tools/kaiord-convert";
import { registerDiffTool } from "../tools/kaiord-diff";
import { registerExtractWorkoutTool } from "../tools/kaiord-extract-workout";
import { registerGetFormatSpecTool } from "../tools/kaiord-get-format-spec";
import { registerInspectTool } from "../tools/kaiord-inspect";
import { registerListFormatsTool } from "../tools/kaiord-list-formats";
import { registerRoundTripValidateTool } from "../tools/kaiord-round-trip-validate";
import { registerValidateTool } from "../tools/kaiord-validate";
import type { ToolContext } from "../tools/tool-context";

export type SharedTexts = {
  readonly formatSpec: string;
  readonly krdSchema: string;
};

export const registerSharedSurface = (
  server: McpServer,
  context: ToolContext,
  texts: SharedTexts
): void => {
  registerGetFormatSpecTool(server, texts.formatSpec);
  registerListFormatsTool(server);
  registerConvertTool(server, context);
  registerValidateTool(server, context);
  registerRoundTripValidateTool(server, context);
  registerInspectTool(server, context);
  registerExtractWorkoutTool(server, context);
  registerDiffTool(server, context);

  registerKrdSchemaResource(server, texts.krdSchema);
  registerSupportedFormatsResource(server);
  registerKrdFormatSpecResource(server, texts.formatSpec);
};
