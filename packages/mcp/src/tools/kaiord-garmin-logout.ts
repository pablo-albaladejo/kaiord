import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "@kaiord/core";

import { formatError, formatSuccess } from "../utils/error-formatter";
import {
  getGarminClient,
  resetGarminClient,
} from "../utils/garmin-client-state";

export const registerGarminLogoutTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_garmin_logout",
    "Log out from Garmin Connect",
    {},
    async () => {
      try {
        logger.debug("Logging out from Garmin Connect");
        const { auth } = getGarminClient(logger);
        await auth.logout();
        resetGarminClient();
        return formatSuccess("Logged out from Garmin Connect.");
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
