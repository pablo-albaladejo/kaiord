import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "@kaiord/core";
import { z } from "zod";

import { formatError, formatSuccess } from "../utils/error-formatter";
import { getGarminClient } from "../utils/garmin-client-state";

const loginSchema = {
  email: z.string().describe("Garmin Connect email address"),
  password: z.string().describe("Garmin Connect password"),
};

export const registerGarminLoginTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_garmin_login",
    "Authenticate with Garmin Connect",
    loginSchema,
    async (args) => {
      try {
        logger.debug("Logging in to Garmin Connect");
        const { auth } = getGarminClient(logger);
        await auth.login(args.email, args.password);
        return formatSuccess("Logged in to Garmin Connect.");
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
