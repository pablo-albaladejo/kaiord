import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { createStderrLogger } from "../adapters/stderr-logger";
import type { ToolContext } from "../tools/tool-context";
import { LOCAL_INSTRUCTIONS, REMOTE_INSTRUCTIONS } from "./instructions";
import { registerLocalSurface } from "./register-local-surface";
import { registerSharedSurface } from "./register-shared-surface";
import type { LocalInputs } from "./resolve-local-inputs";
import { resolveLocalInputs } from "./resolve-local-inputs";
import type { CreateServerOptions } from "./server-options";

const SERVER_NAME = "kaiord-mcp";

// Disk is read only when the caller left an input out, and only at call
// time: importing this module touches no file.
const resolveInputs = (options: CreateServerOptions): LocalInputs => {
  const { version, formatSpec, krdSchema } = options;
  if (
    version !== undefined &&
    formatSpec !== undefined &&
    krdSchema !== undefined
  ) {
    return { version, formatSpec, krdSchema };
  }
  const local = resolveLocalInputs();
  return {
    version: version ?? local.version,
    formatSpec: formatSpec ?? local.formatSpec,
    krdSchema: krdSchema ?? local.krdSchema,
  };
};

export const createServer = (options: CreateServerOptions = {}): McpServer => {
  const remote = options.toolset === "remote";
  const { version, formatSpec, krdSchema } = resolveInputs(options);
  const server = new McpServer(
    { name: SERVER_NAME, version },
    { instructions: remote ? REMOTE_INSTRUCTIONS : LOCAL_INSTRUCTIONS }
  );
  const logger = createStderrLogger();
  const context: ToolContext = {
    logger,
    remote,
    fitWriter: options.fitWriter,
  };

  registerSharedSurface(server, context, { formatSpec, krdSchema });
  if (!remote) registerLocalSurface(server, logger);

  return server;
};
