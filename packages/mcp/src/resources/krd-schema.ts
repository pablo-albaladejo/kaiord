import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const SCHEMA_URI = "kaiord://schema/krd";

export const registerKrdSchemaResource = (
  server: McpServer,
  schema: string
): void => {
  server.resource(
    "krd-schema",
    SCHEMA_URI,
    {
      description: "JSON Schema for the KRD canonical format",
      mimeType: "application/schema+json",
    },
    async () => ({
      contents: [
        {
          uri: SCHEMA_URI,
          mimeType: "application/schema+json",
          text: schema,
        },
      ],
    })
  );
};
