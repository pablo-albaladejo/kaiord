import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const SPEC_URI = "kaiord://docs/krd-format";
const DOCS_URL =
  "https://github.com/pablo-albaladejo/kaiord/blob/main/docs/krd-format.md";

const findSpecFile = (): string => {
  const candidates = [
    resolve(process.cwd(), "docs/krd-format.md"),
    resolve(process.cwd(), "packages/mcp/docs/krd-format.md"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf-8");
    }
  }
  return `KRD format specification not found locally. See: ${DOCS_URL}`;
};

export const registerKrdFormatSpecResource = (server: McpServer): void => {
  const spec = findSpecFile();
  server.resource(
    "krd-format-spec",
    SPEC_URI,
    { description: "KRD format specification document" },
    async () => ({
      contents: [{ uri: SPEC_URI, mimeType: "text/markdown", text: spec }],
    })
  );
};
