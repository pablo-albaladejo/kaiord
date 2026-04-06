import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { formatSuccess } from "../utils/error-formatter";
import { findSpecFile } from "../utils/find-spec-file";

export const registerGetFormatSpecTool = (server: McpServer): void => {
  const spec = findSpecFile();
  server.tool(
    "kaiord_get_format_spec",
    "Get the KRD format specification. Call this before creating or editing KRD documents.",
    {},
    async () => formatSuccess(spec)
  );
};
