import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "@kaiord/core";
import { validateKrd } from "@kaiord/core";
import { z } from "zod";

import { formatError, formatSuccess } from "../utils/error-formatter";
import { resolveTextInput } from "../utils/resolve-input";
import { getGarminClient } from "../utils/garmin-client-state";

const pushSchema = {
  input_file: z.string().optional().describe("Path to KRD JSON file"),
  input_content: z.string().optional().describe("Inline KRD JSON content"),
};

export const registerGarminPushTool = (
  server: McpServer,
  logger: Logger
): void => {
  server.tool(
    "kaiord_garmin_push",
    "Push a KRD workout to Garmin Connect",
    pushSchema,
    async (args) => {
      try {
        logger.debug("Pushing workout to Garmin Connect");
        const { auth, service } = getGarminClient(logger);

        if (!auth.is_authenticated()) {
          return formatError(
            new Error("Not authenticated. Call kaiord_garmin_login first.")
          );
        }

        const text = await resolveTextInput(
          args.input_file,
          args.input_content
        );
        const krd = validateKrd(JSON.parse(text) as unknown);
        const result = await service.push(krd);

        return formatSuccess(JSON.stringify(result, null, 2));
      } catch (error) {
        return formatError(error);
      }
    }
  );
};
