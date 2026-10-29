import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const SPEC_URI = "kaiord://docs/krd-format";

export const registerKrdFormatSpecResource = (
  server: McpServer,
  spec: string
): void => {
  server.resource(
    "krd-format-spec",
    SPEC_URI,
    { description: "KRD format specification document" },
    async () => ({
      contents: [{ uri: SPEC_URI, mimeType: "text/markdown", text: spec }],
    })
  );
};
