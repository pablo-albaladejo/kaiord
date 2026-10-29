import type { CreateServerOptions } from "@kaiord/mcp";
import { createServer } from "@kaiord/mcp";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import formatSpec from "../../../docs/krd-format.md";
import krdSchema from "../../core/schema/krd.json";
import { version } from "../../mcp/package.json";
import { FIT_OUTPUT_CAP_BYTES } from "./limits";

type Logger = NonNullable<CreateServerOptions["logger"]>;

const JSON_INDENT = 2;

/** Byte-identical to `krd.json`, which the schema generator writes this way. */
export const KRD_SCHEMA_TEXT = JSON.stringify(krdSchema, null, JSON_INDENT);

const noop = (): void => undefined;

/** Readers and writers log context such as parse errors: none of it leaves. */
const quietLogger: Logger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

export const buildServer = (): McpServer =>
  createServer({
    toolset: "remote",
    version,
    formatSpec,
    krdSchema: KRD_SCHEMA_TEXT,
    fitWriter: { maxOutputBytes: FIT_OUTPUT_CAP_BYTES },
    logger: quietLogger,
  });
