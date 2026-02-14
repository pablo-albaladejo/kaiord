import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "@kaiord/core";
import { z } from "zod";

import { formatError, formatSuccess } from "../utils/error-formatter";
import { getGarminClient } from "../utils/garmin-client-state";

const listSchema = {
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Max workouts (default 20)"),
  offset: z.number().int().nonnegative().optional().describe("Skip N workouts"),
};

export const registerGarminListTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_garmin_list",
    "List workouts from Garmin Connect",
    listSchema,
    async (args) => {
      try {
        logger.debug("Listing Garmin Connect workouts");
        const { auth, service } = getGarminClient(logger);

        if (!auth.is_authenticated()) {
          return formatError(
            new Error("Not authenticated. Call kaiord_garmin_login first.")
          );
        }

        const workouts = await service.list({
          limit: args.limit,
          offset: args.offset,
        });

        return formatSuccess(JSON.stringify(workouts, null, 2));
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
