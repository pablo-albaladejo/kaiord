import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const SCHEMA_URI = "kaiord://schema/krd";
const FALLBACK_URL = "https://github.com/pablo-albaladejo/kaiord";

const findSchemaFile = (): string => {
  const candidates = [
    resolve(process.cwd(), "packages/core/schema/krd.json"),
    resolve(process.cwd(), "node_modules/@kaiord/core/schema/krd.json"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf-8");
    }
  }
  return JSON.stringify({
    error: `KRD schema file not found. See ${FALLBACK_URL}`,
  });
};

export const registerKrdSchemaResource = (server: McpServer): void => {
  const schema = findSchemaFile();
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
