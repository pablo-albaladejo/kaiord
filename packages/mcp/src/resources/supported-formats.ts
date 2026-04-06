import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { FORMAT_REGISTRY } from "../utils/format-registry";

const FORMATS_URI = "kaiord://formats";

export const registerSupportedFormatsResource = (server: McpServer): void => {
  const data = Object.entries(FORMAT_REGISTRY).map(([key, desc]) => ({
    format: key,
    name: desc.name,
    extension: desc.extension,
    description: desc.description,
    binary: desc.binary,
  }));
  const text = JSON.stringify(data, null, 2);

  server.resource(
    "supported-formats",
    FORMATS_URI,
    { description: "All supported fitness data formats and capabilities" },
    async () => ({
      contents: [{ uri: FORMATS_URI, mimeType: "application/json", text }],
    })
  );
};
