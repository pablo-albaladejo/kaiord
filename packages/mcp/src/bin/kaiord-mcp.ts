import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "../server/create-server";

const main = async (): Promise<void> => {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Kaiord MCP server started");
};

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
