import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { formatSuccess } from "../utils/error-formatter";
import { FORMAT_REGISTRY } from "../utils/format-registry";

export const registerListFormatsTool = (server: McpServer): void => {
  server.tool(
    "kaiord_list_formats",
    "List all supported fitness data formats with capabilities",
    {},
    async () => {
      const formats = Object.entries(FORMAT_REGISTRY).map(([key, desc]) => ({
        format: key,
        name: desc.name,
        extension: desc.extension,
        description: desc.description,
        binary: desc.binary,
      }));
      return formatSuccess(JSON.stringify(formats, null, 2));
    }
  );
};
