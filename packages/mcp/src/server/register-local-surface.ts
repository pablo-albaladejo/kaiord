import type { Logger } from "@kaiord/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerAnalyzeWorkoutPrompt } from "../prompts/analyze-workout";
import { registerConvertFilePrompt } from "../prompts/convert-file";
import { registerGarminListTool } from "../tools/kaiord-garmin-list";
import { registerGarminLoginTool } from "../tools/kaiord-garmin-login";
import { registerGarminLogoutTool } from "../tools/kaiord-garmin-logout";
import { registerGarminPushTool } from "../tools/kaiord-garmin-push";
import {
  registerGetHrvHistoryTool,
  registerGetSleepHistoryTool,
  registerGetWeightHistoryTool,
} from "../tools/kaiord-get-health-history";
import { registerGetHealthSummaryTool } from "../tools/kaiord-get-health-summary";
import { registerGetRecoveryStatusTool } from "../tools/kaiord-get-recovery-status";

export const registerLocalSurface = (
  server: McpServer,
  logger: Logger
): void => {
  registerGarminLoginTool(server, logger);
  registerGarminLogoutTool(server, logger);
  registerGarminListTool(server, logger);
  registerGarminPushTool(server, logger);
  registerGetHealthSummaryTool(server, logger);
  registerGetSleepHistoryTool(server, logger);
  registerGetWeightHistoryTool(server, logger);
  registerGetHrvHistoryTool(server, logger);
  registerGetRecoveryStatusTool(server, logger);

  registerConvertFilePrompt(server);
  registerAnalyzeWorkoutPrompt(server);
};
